var NodeHelper = require('node_helper');
var undici = require('undici');

module.exports = NodeHelper.create({
  start: function () {
    console.log('MMM-CGM helper, started...');
  },

  getCurrentReading: function (payload) {
    var _this = this;
    undici
      .request(`${payload.baseUrl}/General/AuthenticatePublisherAccount`, {
        method: 'POST',
        body: JSON.stringify({
          accountName: payload.username,
          password: payload.password,
          applicationId: payload.applicationId,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then((accountResponse) =>
        accountResponse.statusCode < 300 ? accountResponse.body : ''
      )
      .then((accountBody) => accountBody.json())
      .then((accountNumber) => {
        if (accountNumber) {
          undici
            .request(`${payload.baseUrl}/General/LoginPublisherAccountById`, {
              method: 'POST',
              body: JSON.stringify({
                accountId: accountNumber,
                password: payload.password,
                applicationId: payload.applicationId,
              }),
              headers: {
                'Content-Type': 'application/json',
              },
            })
            .then((sessionResponse) =>
              sessionResponse.statusCode < 300 ? sessionResponse.body : ''
            )
            .then((sessionBody) => sessionBody.json())
            .then((sessionId) => {
              if (sessionId) {
                undici
                  .request(
                    `${payload.baseUrl}/Publisher/ReadPublisherLatestGlucoseValues`,
                    {
                      method: 'POST',
                      body: JSON.stringify({
                        sessionId,
                        minutes: 10,
                        maxCount: 1,
                      }),
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    }
                  )
                  .then((readingResponse) =>
                    readingResponse.statusCode < 300 ? readingResponse.body : []
                  )
                  .then((readingBody) => readingBody.json())
                  .then((readingJson) => {
                    if (readingJson.length > 0) {
                      const currentReading = readingJson[0];
                      _this.sendSocketNotification('GOT_NEW_CGM_VALUE', {
                        applicationId: payload.applicationId,
                        glucose: currentReading.Value,
                        trend: currentReading.Trend,
                      });
                    }
                  });
              }
            });
        }
      })
      .catch((error) => console.error('Error', error));
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === 'GET_NEW_CGM_VALUE') {
      this.getCurrentReading(payload);
    }
  },
});
