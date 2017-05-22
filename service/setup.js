const logger = require('../lib/logger');
const facebookWebhooks = require('../lib/facebook-webhooks');

const configureFacebookWorkplace = () => {
  // Enable subscriptions for the App
  facebookWebhooks.enableSubscription((enableSubscriptionErr) => {
    if (enableSubscriptionErr) {
      logger.error('Unable to setup subscription in Workplace, please check your configuration settings.');
    } else {
      logger.info('Subscription enabled in Workplace.');

      /* eslint-disable */
      // Look's like there is a bug when registering webhooks using this method.
      // Group posts are returning a different response than when registering via the webui.

      // Enable page webhook
      /*facebookWebhooks.subscribePageWebhook((pageWebhookErr) => {
        if (pageWebhookErr) logger.error('Unable to configure page webhook in Workplace, please check your configuration settings.');
        else logger.info('Page webhook enabled in Workplace.');
      });*

      // Enable group webhook
      /*facebookWebhooks.subscribeGroupWebhook((groupWebhookErr) => {
        if (groupWebhookErr) logger.error('Unable to configure group webhook in Workplace, please check your configuration settings.');
        else logger.info('Group webhook enabled in Workplace.');
      });*/
      /* eslint-enable */

      // Configure get started button
      facebookWebhooks.configureGettingStarted((gettingStartedErr) => {
        if (gettingStartedErr) {
          logger.error('Unable to configure get started button in Workplace, please check your configuration settings.');
        } else {
          logger.info('Get Started button configure in Workplace.');

          // Can't add a persistent menu without a Get Started button.
          facebookWebhooks.configurePersistentMenu((persistentMenuErr) => {
            if (persistentMenuErr) logger.error('Unable to configure persistent menu in Workplace, please check your configuration settings.');
            else logger.info('Persistent Menu configured in Workplace.');
          });

          facebookWebhooks.configureGreetingText((greetingTextErr) => {
            if (greetingTextErr) logger.error('Unable to configure greeting text in Workplace, please check your configuration settings.');
            else logger.info('Greeting Text configured in Workplace.');
          });
        }
      });
    }
  });
};

module.exports = {
  configureFacebookWorkplace,
};
