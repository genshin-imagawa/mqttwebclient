let client
let isConnected = false
let subTopics = []
let alertCount = 0

$(function () {
  // 接続ボタン
  $('#connectBtn').click(function () {
    if (!isConnected) {
      // CONNECT
      const host = $('#host').val()
      const port = $('#port').val()
      const user = $('#user').val()
      const password = $('#pass').val()
      const clientId = 'webclient-' + Math.floor(Math.random() * 100000)

      client = new Paho.MQTT.Client(host, Number(port), clientId)
      client.onConnect = onConnect
      client.onMessageArrived = onMessageArrived
      client.onConnectionLost = onConnectionLost

      client.connect({
        userName: user,
        password,
        onSuccess: onConnect,
        onFailure,
        useSSL: false
      })
    } else {
      // DISCONNECT
      client.disconnect()
      console.log('disconnect')
    }
  })

  // Publishボタン
  $('#publishBtn').click(function () {
    if (!isConnected) {
      animateAlert('MQTT Brokerに接続してください', 'alert-warning')
      return
    }
    const destination = $('#pubTopic').val()
    const text = $('#pubMessage').val()
    const retain = $('#pubRetain').prop('checked')
    const qos = Number($('#pubQos').val())
    if (!destination) {
      animateAlert('Topicを入力してください', 'alert-warning')
      return
    }
    const message = new Paho.MQTT.Message(text)
    message.destinationName = destination
    message.retained = retain
    message.qos = qos
    client.send(message)
    animateAlert('送信しました', 'alert-success')
    console.log('message send.')
  })

  // Subscribeボタン
  $('#subscribeBtn').click(function () {
    if (!isConnected) {
      animateAlert('MQTT Brokerに接続してください', 'alert-warning')
      return
    }
    const destination = $('#subTopic').val()
    if (!destination) {
      animateAlert('Topicを入力してください', 'alert-warning')
      return
    }
    if ($.inArray(destination, subTopics) !== -1) {
      animateAlert('すでにSubscribeしています', 'alert-warning')
      return
    }
    client.subscribe(destination)
    subTopics.push(destination)
    const el = $('#subTopicTemplate').clone()
    el.removeAttr('id')
    el.addClass('subtopic-div')
    el.find('span').html(destination)
    $('#topicsDiv').prepend(el)
    el.fadeIn()
    animateAlert('Subscribeしました', 'alert-success')
    console.log('subscribe.')

    // Unsubscribeボタン
    el.click(function () {
      if (!isConnected) {
        animateAlert('MQTT Brokerに接続してください', 'alert-warning')
        return
      }
      const el = $(this).closest('.subtopic-div')
      const destination = el.find('span').html()
      client.unsubscribe(destination)
      subTopics = subTopics.filter(topic => topic !== destination)
      el.remove()
      animateAlert('Unsubscribeしました', 'alert-success')
      console.log('unsubscribe.')
    })
  })

  // Clear Messagesボタン
  $('#clearMessagesBtn').click(function () {
    $('.message-div').remove()
    animateAlert('メッセージを削除しました', 'alert-info')
  })
})

// 接続時
const onConnect = function (frame) {
  console.log('connected to ' + $('#host').val() + '.')
  animateConnect()
  isConnected = true
  animateAlert('接続しました', 'alert-success')
}

// メッセージ受信時の処理
const onMessageArrived = function (message) {
  const topic = message.destinationName
  const payload = message.payloadString
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss')

  const el = $('#messageTemplate').clone()
  el.removeAttr('id')
  el.addClass('message-div')
  el.find('.topic-span').html(topic)
  el.find('.payload-span').html(payload)
  el.find('.time-span').html(timestamp)
  $('#receivedDiv').prepend(el)
  el.fadeIn()
  animateAlert('メッセージを受信しました', 'alert-info')
}

// 接続失敗時
const onFailure = function (failure) {
  console.log('failure.')
  console.log(failure.errorMessage)
  animateDisconnect()
  animateAlert('接続失敗しました', 'alert-danger')
}

// 切断時
const onConnectionLost = function (responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log('connection lost.')
    console.log(responseObject.errorCode)
  }
  animateDisconnect()
  subTopics = []
  $('.subtopic-div').remove()
  animateAlert('接断しました', 'alert-danger')
  isConnected = false
}

// 接続時のアニメーション
const animateConnect = function () {
  $('#connectBtn').removeClass('btn-success')
  $('#connectBtn').addClass('btn-danger')
  $('#connectBtn').html('DISCONNECT')
  $('#disconnectBar').hide()
  $('#connectBar').width('0px')
  $('#connectBar').removeClass('bg-danger')
  $('#connectBar').addClass('bg-success')
  $('#connectBar').animate({
    width: '100%'
  })
}

// 未接続時のアニメーション
const animateDisconnect = function () {
  $('#connectBtn').removeClass('btn-danger')
  $('#connectBtn').addClass('btn-success')
  $('#connectBtn').html('CONNECT')
  $('#connectBar').width('0px')
  $('#connectBar').removeClass('bg-success')
  $('#connectBar').addClass('bg-danger')
  $('#connectBar').animate({
    width: '100%'
  })
}

// アラートのアニメーション
// className: alert-primary, alert-secondary, alert-success, alert-danger, alert-warning, alert-info, alert-light, alert-dark
const animateAlert = function (text, className) {
  alertCount++
  $('#alertDiv').removeClass()
  $('#alertDiv').addClass('alert')
  $('#alertDiv').addClass('text-center')
  $('#alertDiv').html(text)
  $('#alertDiv').addClass(className)
  $('#alertDiv').hide()
  $('#alertDiv').fadeIn()
  setTimeout(() => {
    if (alertCount === 1) {
      $('#alertDiv').fadeOut()
    }
    alertCount--
  }, 2000)
}
