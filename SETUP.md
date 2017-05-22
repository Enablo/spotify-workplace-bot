# Setup

Follow the following steps to get Enablo Radio working. They are a little rough now but will look to update with screenshots or walkthrough video soon.

1. Create a new production.json config file based on default-sample.json.
2. Go to Workplace and navigate to Dashboard > Integrations and click on Create Custom Integration.
3. Enter an Integration name (eg. Enablo Radio) 
4. Grab the App ID, App Secret and Create a new Access token and put these in your production.json file.
5. Enable the following permissions. Read content, Read content visible content, Manage content, Manage groups, Message any member.
6. Save and close the integration window.
7. At the bottom of the integrations page, you will also find your Company ID, grab the number in the URL at the bottom /company/{ company id }/scim/ and put in the production.json.
8. Go to Spotify Developers (https://developer.spotify.com/my-applications)
9. Create a new application, enter an Application Name and Description then click create.
10. Grab the Client ID and Client Secret and put these in your production.json file.
12. Add the redirect URI. This will be your public URL + /spotify/service/callback (eg. https://host.com/spotify/service/callback).
13. Save the Spotify Settings.
14. Finalise configuration of your production.json file
    * webapp.publicUrl: the public URL for the app (eg. https://host.com)
    * database.mongo: the connection URL for your mongo database
    * spotify.workplaceAdmins: the user ID's of Workplace you want to be able to configure the integration
    * spotify.workplaceGroups: the group ID's of Workplace you want to listen to for updates
    * facebookWorkplace.verifyToken: a random string used when configuring the webhooks
15. Now start the application, there is a number of ways to do this. You can push it out to a PaaS, but that requires additional configuration which I will not cover here. We also use Kubernettes which I will look to add a config for. Probably the easiest way at the moment is to use docker-compose, an example without HTTPS can be [found here](https://gist.github.com/enablo-dev/f7901ae194ddee3d7ecebb70b3c392c1).
16. Once the application is running, time to configure the Workplace webhooks. Open the integration you defined before and click on Configure Webhooks.
    1. Page
        * Callback URL: https://{ your public url }/facebook/pages/webhook
        * Subscription Fields: mention, messages, messaging_postbacks
        * Verify Token: The random string you generated before
    2. Groups
        * Callback URL: https://{ your public url }/facebook/groups/webhook
        * Subscription Fields: comments, posts
        * Verify Token: The random string you generate before
17. Click save and Facebook should verify it can reach the application.
18. Now go back to Facebook Messanger and search for the name of the Application you created.
19. Open a conversation with it and click Get Started and walk through the configuration.

