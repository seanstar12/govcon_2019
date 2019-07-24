<div class="<?php print $classes; ?>"<?php if ($chat_id) print ' data-chat-id="' . $chat_id . '"'; ?>>

  <div class="slack-chat-error">
  </div>

  <div class="slack-chat-start-form">
    <?php print render($name_field); ?>
    <?php print render($start_button); ?>
  </div>

  <div class="slack-chat-conversation">
    <div class="slack-chat-welcome">
      <?php print $welcome_message; ?>
    </div>

    <div class="slack-chat-messages">
      <?php foreach ($messages as $message): ?>
        <div class="slack-chat-message-container">
          <span class="slack-chat-message-user"><?php print check_plain($message['username']); ?>: </span><span class="slack-chat-message-text"><?php print check_plain($message['text']); ?></span>
        </div>
      <?php endforeach; ?>
    </div>

    <div class="slack-chat-message-form">
      <?php print render($message_field); ?>
      <?php print render($send_button); ?>
      <?php print render($end_button); ?>
    </div>

    <div class="slack-chat-ended-message">
      <?php print $ended_message; ?>
    </div>
  </div>
  
</div>
