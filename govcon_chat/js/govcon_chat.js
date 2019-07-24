(function ($) {

  Drupal.slackChat = {};
  Drupal.slackChat.chats = [];

  /**
   * Constructor.
   *
   * @param $el
   *   The jQuery element to initialize the chat on.
   */
  Drupal.slackChat.chatModel = function ($el) {
    var _this = this;
    var chatId;

    this.$el = $el;
    this.chatId = null;
    this.username = 'Me';

    var cookie = (document.cookie.match(/^(?:.*;)?\s*session\s*=\s*([^;]+)(?:.*)?$/)||[,null])[1];

    this.timer = setInterval(() => _this.messageChecker(), 5000);
        //clearInterval(_this.timer);

    if (cookie) {
      chatId = cookie;
      $el.attr('data-chat-id', chatId);
      this.chatId = chatId;
      Drupal.settings.slackChat.session = chatId;
    }

    this.startChat();

    $el.find('.chathead-toggle').click(function() {
      $(this).closest('.chat').find('#togglearea').toggle();
      _this.scrollToBottom();
    });
    $el.find('.chathead-user').click(function() {
      $(this).closest('.chat').find('#togglearea').toggle();
      _this.scrollToBottom();
    });
    $el.find('#chathead-close').click(function(e) {
      var _chat = $(this).closest('.chat');

     _chat.find('#govcon-message').attr('disabled', 'disabled');
      _this.handleEnd();
    });

    $el.find("#govcon-message").keyup(function(e) {
      if (e.keyCode == 13 && !e.shiftKey && !e.ctrlKey) {
        _this.handleSubmit();
      }

      else {
        return true;
      }
    });
  };

  Drupal.slackChat.chatModel.prototype.messageChecker = function () {
    var _this = this;

    var obj = {type: 'drupal_get_chat', name: this.username, session: Drupal.settings.slackChat.session};
    console.log('get_chat:', obj);

    this.makeAjaxCall(obj, function (result) {
      if (!result) {
        clearInterval(_this.timer);
        _this.printMessage('system', 'A gateway error has occured.');
      }
      console.log('getChat[obj]', result);

      if (result) {
        var $messages = _this.$el.find('.feed');
        $messages.html('');
        for (var i =0; i< result.messages.length; i++) {
          //findObjectByKey(array, key, value);
          //console.log('isEquiv', isEquivalent({'a':3}, {'a': 3}));
          _this.printMessage(result.messages[i].user, result.messages[i].text, result.messages[i].user_image, result.messages[i].time);
        }
      }
      //if (result === false || result.status != 'ok') {
      //  _this.printMessage('system', 'We are unable to start a chat for you.');
      //  console.log('Unable to start chat:' + result.status);
      //  return;
      //}
      
      //_this.$el.attr('data-chat-id', result.session);
      //_this.$el.addClass('slack-chat-started');
      //_this.chatId = result.session;
      //_this.username = name;

      //if (result.messages.length) {
      //  for(var i = 0; i < result.messages.length; i++) {
      //    var currentTime = new Date();
      //    var hours = currentTime.getHours();
      //    var minutes = currentTime.getMinutes();

      //    _this.messages = result.messages;

      //    _this.printMessage(result.messages[i].user, result.messages[i].text, result.messages[i].user_image, result.messages[i].time);
      //  }
      //}
      //else {
      //  _this.printMessage('Bot', 'Heyyyy. wyd?');
      //}
      //setTimeout(_this.messageChecker(),5000);
    });
    
  }

  /**
   * Initiates a chat session.
   *
   * @param name
   *   The user's name.
   */
  Drupal.slackChat.chatModel.prototype.startChat = function () {
    var _this = this;

    var obj = {type: 'drupal_start_chat', name: this.username, session: Drupal.settings.slackChat.session};
    console.log('startChat:', obj);
    this.username = "Me";

    this.makeAjaxCall(obj, function (result) {
      console.log('startChat[obj]', result);

      if (result === false || result.status != 'ok') {
        _this.printMessage('system', 'We are unable to start a chat for you.');
        clearInterval(_this.timer);
        console.log('Unable to start chat:' + result.status);
        return;
      }
      
      _this.$el.attr('data-chat-id', result.session);
      _this.$el.addClass('slack-chat-started');
      _this.chatId = result.session;
      _this.username = name;

      if (result.messages.length) {
        for(var i = 0; i < result.messages.length; i++) {
          var currentTime = new Date();
          var hours = currentTime.getHours();
          var minutes = currentTime.getMinutes();

          _this.messages = result.messages;

          _this.printMessage(result.messages[i].user, result.messages[i].text, result.messages[i].user_image, result.messages[i].time);
        }
      }
      else {
        _this.printMessage('Bot', 'Send a message to begin.');
      }
    });
  };

  /**
   * Ends the chat session.
   */
  Drupal.slackChat.chatModel.prototype.endChat = function (notify) {
    this.$el.addClass('slack-chat-ended');

    this.makeAjaxCall({command: 'end_chat', notify: (notify ? 1 : 0)}, function (result) {
      if (result === false || result.status != 'ok') {
        console.log('Unable to end chat:' + result.status);
      }
    });
  };

  /**
   * Click handler for the end chat button.
   */
  Drupal.slackChat.chatModel.prototype.handleEnd = function () {
    this.endChat(true);
  };

  /**
   * Click handler for the send button. Checks if there is any message entered,
   * and sends it.
   */
  Drupal.slackChat.chatModel.prototype.handleSend = function () {
    var $input = this.$el.find('.govcon-chat-message-field');
    var text = $input.val();

    if (!text) {
      return;
    }

    var currentTime = new Date();
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();

    var message = text;
    console.log(this.$el.find('.feed'));
    this.$el.find('.feed').append("<div class='me'><div class='profile'><img src='https://govcon.starn.es/sites/all/modules/custom/govcon_chat/assets/squirrel.jpg'></div><div class='message'>"+(text)+"<div class='meta'>11/19/13, "+hours+":"+minutes+" PM</div></div></div>");

    this.scrollToBottom();
    this.makeAjaxCall({type: 'drupal_message', name: 'user', text: text, session: Drupal.settings.slackChat.session}, function (result) {
      console.log(result);
    });

    //this.sendMessage(text);
    $input.val('');
  };

  Drupal.slackChat.chatModel.prototype.handleSubmit = function () {
    var $input = this.$el.find('#govcon-message');
    var msg = $input.val();

    if (!msg) {
      return;
    }

    this.sendMessage(msg);
    $input.val('');
  };

  /**
   * Sends a message to Slack.
   *
   * @param text
   *   The message to send.
   */
  Drupal.slackChat.chatModel.prototype.sendMessage = function (text) {
    this.username = "Me";
    var _this = this;
    console.log('sendMessage', {'username': this.username, 'text': text});

    //this.printMessage(this.username, text);

    //@TODO
    this.makeAjaxCall({type: 'drupal_message', name: _this.username, text: text, session: Drupal.settings.slackChat.session}, function (result) {
      if (result === false || result.status != 'ok') {
        _this.showError(Drupal.t('We are unable to send your message. Please try again later.'));
        console.log('Unable to send message:' + result.status);
      }
      console.log('sendMessage result', result);
      _this.printMessage('Me', result.message.text, null,result.message.time);
    });
  };

  /**
   * Displays an error message to the user.
   *
   * @param text
   *   Error text.
   */
  Drupal.slackChat.chatModel.prototype.showError = function (text) {
    var $error = this.$el.find('.slack-chat-error');

    $error.text(text);

    setTimeout(function () {
      $error.text('');
    }, 5000);
  };

  /**
   * Renders a message into the message container.
   *
   * @param user
   *   Username of the sender.
   * @param text
   *   Message text.
   */
  Drupal.slackChat.chatModel.prototype.printMessage = function (user = "", text = "", img = "", time = "") {
    var $messages = this.$el.find('.feed');
    var currentTime = new Date();
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();
    var usr_img = '/sites/all/modules/custom/govcon_chat/assets/squirrel.jpg';
    var bot_img = '/sites/all/modules/custom/govcon_chat/assets/leeroy.jpg';
    var slack_img = '/sites/all/modules/custom/govcon_chat/assets/slack-logo-pink.svg';

    if (minutes < 10) minutes = "0" + minutes;

    time = (time !== "" && time !== null) ? time : hours + ":" + minutes;

    if (user !== "" && text !== "" && text !== null & user !== null) {
      user = user.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }


    var $chat = $('<div></div>').addClass((user !== "Me") ? "other" : "me"); //test

    if (user === "system") {
      var $text = $('<div class="chat-status"></div>').html(text);
      var $meta = $('<div class="meta"></div>').html(hours + ":" + minutes);
      $text.append($meta);
      $chat.append($text);
    }
    else {
      user = (user) ? user : "BOT" ;
      if (img === "" || img === null) {
        if (user === "Bot") {
          img = bot_img;
        }
        else if (user === "me" || user === "Me") {
          img = usr_img;
        }
        else {
          img = slack_img;
        }
      }

      var $text = $('<div class="message"></div>').html(text);
      var $meta = $('<div class="meta"></div>').html(user + " • " + time);
      $text.append($meta);

      var $img = $('<img>').attr('src', img != "" ? img : '/sites/all/modules/custom/govcon_chat/assets/squirrel.jpg'); //test
      var $profile = $('<div class="profile"></div>').html($img); //test

      $chat.append($profile).append($text);
    }

    $messages.append($chat);

    this.scrollToBottom();
  };

  /**
   * Scrolls the message view to the last message.
   */
  Drupal.slackChat.chatModel.prototype.scrollToBottom = function (user, text) {
    var $messages = this.$el.find('.feed');
    var scrollTop = $messages[0].scrollHeight - $messages.height();
   // $(this).find(".feed").scrollTop($(".feed")[0].scrollHeight);
    $messages.scrollTop(scrollTop);
  };

  /**
   * Sends an ajax request to the server.
   *
   * @param params
   *   Parameters to send along with the request.
   * @param callback
   *   A function to call when the call finishes. First argument will be the
   *   returned data, or false on error.
   */
  Drupal.slackChat.chatModel.prototype.makeAjaxCall = function (params, callback) {
    params = params || {};
    params.token = Drupal.settings.slackChat.csrf_token;

    $.ajax({
      type: 'POST',
      url: Drupal.settings.slackChat.url,
      dataType: 'json',
      data: params,
      success: function (data, textStatus, XHR) {
        console.log('makeAjaxCall', {data, textStatus, XHR});
        if (callback) {
          callback(data);
        }
      },
      error: function (XHR, textStatus, error) {
        console.log('Unable to send AJAX request:' + textStatus);
        if (callback) {
          callback(false);
        }
      }
    });
  };

  /**
   * Responds to an event received from node.js.
   *
   * @param message
   *   Message received from node.js
   */
  Drupal.slackChat.chatModel.prototype.handleEvent = function (message) {
    if (message.event == 'message') {
      this.printMessage(message.user, message.text);
    }
    else if (message.event == 'ended') {
      this.endChat(false);
    }
  };


  /**
   * Drupal behavior.
   */
  Drupal.behaviors.slackChat = {
    attach: function (context) {

      // Initialize chat object.
      $('.chatarea', context).each(function (index) {
        var chat = new Drupal.slackChat.chatModel($(this));
        Drupal.slackChat.chats.push(chat);
      });

    }
  };


})(jQuery);

function isEquivalent(a, b) {
    // Create arrays of property names
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);

    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length != bProps.length) {
        return false;
    }

    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];

        // If values of same property are not equal,
        // objects are not equivalent
        if (a[propName] !== b[propName]) {
            return false;
        }
    }

    // If we made it this far, objects
    // are considered equivalent
    return true;
}

function findObjectByKey(array, key, value) {
  for (var i = 0; i < array.length; i++) {
    if (array[i][key] === value) {
      return array[i];
    }
  }
  return null;
}
