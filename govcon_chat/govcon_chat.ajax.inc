<?php

/**
 * @file
 * Functions related to ajax callbacks.
 */

/**
 * Menu callback for the ajax callback.
 */
function govcon_chat_ajax_callback() {
  $error = FALSE;

  if (empty($_POST['command']) || empty($_POST['token']) || !preg_match('@^[a-z_]+$@', $_POST['command'])) {
    $error = 'Invalid request.';
  }
  else {
    $command_callback = 'govcon_chat_ajax_command_' . $_POST['command'];

    if (!drupal_valid_token($_POST['token'], 'govcon_chat_csrf')) {
      $error = 'Invalid token.';
    }
    else if (!function_exists($command_callback)) {
      $error = 'Invalid command.';
    }
  }
  
  if ($error) {
    $response = array(
      'status' => $error,
    );
  }
  else {
    $response = $command_callback($_POST);
  }
  
  drupal_json_output($response);
}

/**
 * Callback for the send_message command.
 */
function govcon_chat_ajax_command_send_message($params) {

  if (empty($params['text'])){
    return array('status' => 'Text missing.');
  }

  if (empty($_SESSION['slack_chat_session'])) {
    return array('status' => 'There is no open chat session.');
  }

  $result = $slack_client->sendMessage($_SESSION['slack_chat_session']['username'], $_SESSION['slack_chat_session']['slack_channel_id'], $params['text']);

  return array(
    'status' => $result ? 'ok' : 'Unable to send message',
  );
}

/**
 * Callback for the start_chat command.
 */
function govcon_chat_ajax_command_start_chat($params) {
  if (empty($params['name'])){
    return array('status' => 'Name missing.');
  }

  //https://api.drupal.org/api/drupal/includes%21common.inc/function/flood_register_event/7.x
  if (!flood_is_allowed('govcon_chat_start', variable_get('govcon_chat_message_rate', 5), variable_get('slack_chat_flood_window', 30) * 60)) {
    watchdog('slack_chat', 'Chat request denied. The maximum number of chats has been reached.', array(), WATCHDOG_ERROR);
    return array('status' => 'Too many chat requests.');
  }
  flood_register_event('slack_chat_start', variable_get('slack_chat_flood_window', 30) * 60);

  // Generate random id for this chat session.
  $chat_id = 'slack_chat_' . drupal_base64_encode(hash('sha256', session_id() . drupal_random_bytes(32), TRUE));

  $slack_channel_id = slack_chat_prepare_slack_chat($params['name']);
  if (!$slack_channel_id) {
    return array('status' => 'Unable to create Slack channel for chat.');
  }

  // Use chat_id for the channel name in node.js.
  $channel_token = slack_chat_prepare_nodejs_channel($chat_id, $slack_channel_id);

  $_SESSION['slack_chat_session'] = array(
    'chat_id' => $chat_id,
    'slack_channel_id' => $slack_channel_id,
    'username' => $params['name'],
  );

  return array(
    'status' => 'ok',
    'chat_id' => $chat_id,
    'channel_token' => $channel_token,
  );
}

/**
 * Callback for the end_chat command.
 */
function govcon_chat_ajax_command_end_chat($params) {
  //$slack_client = SlackClient::getClient();

  if (empty($_SESSION['slack_chat_session'])) {
    return array(
      'status' => 'No active session found.',
    );
  }

  // If 'notify' is true, notify the Slack user that the session ended, and
  // archive the channel. Should be set when the visitor requests that the chat
  // be ended.
  if (!empty($params['notify'])) {
    $text = t('!name has ended the chat.', array('!name' => $_SESSION['slack_chat_session']['username']));
    //$slack_client->sendMessage($_SESSION['slack_chat_session']['username'], $_SESSION['slack_chat_session']['slack_channel_id'], $text);
    //$slack_client->archiveChannel($_SESSION['slack_chat_session']['slack_channel_id']);
  }

  unset($_SESSION['slack_chat_session']);

  return array(
    'status' => 'ok',
  );
}

