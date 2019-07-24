<?php

/**
 * @file
 * Page callbacks for admin pages.
 */

function govcon_chat_config_form($form, &$form_state) {
  $access_info = variable_get('slack_chat_access_info', array());
  $is_authorized = !empty($access_info['access_token']);
  $channel_options = array();

  // Retrieve channel list, if the app is already authorized.
  if ($is_authorized) {
    $channels = $slack_client->getChannelList();

    if (!$channels) {
      drupal_set_message(t('Unable to retrieve channel list from Slack. Try reauthorizing the Slack app.'), 'error');
      $channel_options['_none'] = t('None');
    }
    else {
      foreach ($channels as $channel) {
        $channel_options[$channel['id']] = check_plain($channel['name']);
      }
    }
  }
  $out = fopen('php://stderr', 'w');
  fputs($out, json_encode(['i' => 'verk']));
  fclose($out);

  $form['slack_chat_app'] = [
    '#type' => 'fieldset',
    '#title' => 'Govcon Chat settings',

    'govcon_chat_start_message' => [
      '#type' => 'textfield',
      '#title' => t('Chat Initial Message'),
      '#description' => t('Text that displays in the chat window when a user starts a chat session.'),
      '#default_value' => variable_get('govcon_chat_start_message', t('How can we help you today?')),
    ],
    'govcon_chat_channel_id' => [
      '#type' => 'textfield',
      '#title' => t('Channel ID'),
      '#description' => t('ID of slack channel to store the threads'),
      '#default_value' => variable_get('govcon_chat_channel_id', ""),
    ],
    'govcon_chat_bot_token' => [
      '#type' => 'textfield',
      '#title' => t('Slack Bot Token'),
      '#description' => t('Token for slack api calls'),
      '#default_value' => variable_get('govcon_chat_bot_token', ''),
    ],
    'govcon_chat_webhook' => [
      '#type' => 'textfield',
      '#title' => t('Slack Webhook Url'),
      '#description' => t('webhook url'),
      '#default_value' => variable_get('govcon_chat_webhook', ''),
    ],
    'govcon_chat_page_whitelist' => [
      '#type' => 'textfield',
      '#default_value' => variable_get('govcon_chat_page_whitelist', '*'),
      '#description' => t('Comma separated list of allowed pages. Default: "*"'),
      '#title' => t('Chat Page Whitelist'),
    ],
    'govcon_chat_message_rate' => [
      '#type' => 'textfield',
      '#default_value' => variable_get('govcon_chat_message_rate', '5'),
      '#description' => t('Rate in seconds at which users are allowed to send messages, default: 5 seconds'),
      '#size' => 6,
      '#maxlength' => 4,
      '#title' => t('Message Rate'),
    ]
  ];

  return system_settings_form($form);
}

/**
 * Validation callback for the config form.
 */
function govcon_chat_config_form_validate($form, &$form_state) {
  if (!is_numeric($form_state['values']['govcon_chat_message_rate'])) {
    form_set_error('govcon_chat_message_rate', t('Message Rate is not a number, please enter in a valid time.'));
  }
}

/**
 * Submit handler for the 'authorize' button.
 */
//function slack_chat_config_authorize_app_submit($form, &$form_state) {
//  $params = array(
//    'client_id' => variable_get('slack_chat_client_id', ''),
//    'scope' => SLACK_CHAT_AUTH_SCOPES,
//    'redirect_uri' => url('slack-chat/authorize', array('absolute' => TRUE)),
//    'state' => drupal_get_token('slack_chat'),
//  );
//
//  $auth_url = url(SLACK_CHAT_AUTH_URL, array('external' => TRUE, 'query' => $params));
//
//  if (module_exists('overlay') && overlay_get_mode() == 'child') {
//    // If the overlay is open, we are in an iframe. Close the overlay so that
//    // the whole page redirects.
//    unset($_GET['destination']);
//    overlay_close_dialog($auth_url, array('external' => TRUE));
//
//    $form_state['redirect'] = FALSE;
//  }
//  else {
//    $form_state['redirect'] = $auth_url;
//  }
//}

/**
 * Page callback for the authorization page.
 */
function govcon_chat_authorize_page() {
  //$slack_client = SlackClient::getClient();

  // When Slack redirects back to this page, it should either pass 'error' or
  // 'code' in the query string. 'state' is an arbitrary parameter that can be
  // passed to Slack and will be passed back as is. Used as a verification token
  // here.
  //if (!empty($_GET['error'])) {
  //  drupal_set_message(t('Authorization failed. Please try again.'), 'error');
  //  drupal_goto('admin/config/system/slack-chat');
  //}
  //else if (empty($_GET['code']) || empty($_GET['state']) || !drupal_valid_token($_GET['state'], 'slack_chat')) {
  //  return MENU_ACCESS_DENIED;
  //}

  //$response = $slack_client->authenticate(variable_get('slack_chat_client_id', ''), variable_get('slack_chat_client_secret', ''), $_GET['code'], url('slack-chat/authorize', array('absolute' => TRUE)));
  //if (!$response) {
  //  drupal_set_message(t('Authorization failed. Check the log messages for more details.'), 'error');
  //  drupal_goto('admin/config/system/slack-chat');
  //}

  //$access_info = array(
  //  'access_token' => !empty($response['access_token']) ? $response['access_token'] : '',
  //  'user_id' => !empty($response['user_id']) ? $response['user_id'] : '',
  //  'team_id' => !empty($response['team_id']) ? $response['team_id'] : '',
  //  'team_name' => !empty($response['team_name']) ? $response['team_name'] : '',
  //  'bot_user_id' => !empty($response['bot']['bot_user_id']) ? $response['bot']['bot_user_id'] : '',
  //  'bot_access_token' => !empty($response['bot']['bot_access_token']) ? $response['bot']['bot_access_token'] : '',
  //);
  //variable_set('slack_chat_access_info', $access_info);

  //drupal_set_message('The authorization has been successful.');

  //$response = Nodejs::httpRequest('nodejs/slack_chat/reset', array('method' => 'POST'));
  //if (!$response || $response->status != 'success') {
  //  drupal_set_message('An error occurred while trying to communicate with the Node.js server. Please verify the Node.js server configuration.', 'error');
  //}

  //drupal_goto('admin/config/system/slack-chat');
}

