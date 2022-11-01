const msalConfig = {
    auth: {
        clientId: '8937fd89-13f0-493c-8f6e-4c0224dfdfed'
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);
let myAccessToken;

const a = async () => {
    const redirectResponse = await msalInstance.handleRedirectPromise();
    if (redirectResponse !== null) {
        // Acquire token silent success
        let accessToken = redirectResponse.accessToken;
        // Call your API with token
        myAccessToken = accessToken;
        console.log(accessToken);
    } else {
        // MSAL.js v2 exposes several account APIs, logic to determine which account to use is the responsibility of the developer
        const account = msalInstance.getAllAccounts()[0];

        const accessTokenRequest = {
            scopes: ["user.read"],
            account: account,
        };

        msalInstance
            .acquireTokenSilent(accessTokenRequest)
            .then(function (accessTokenResponse) {
                // Acquire token silent success
                // Call API with token
                let accessToken = accessTokenResponse.accessToken;
                // Call your API with token
                myAccessToken = accessToken;
                console.log(accessToken);
            })
            .catch(function (error) {
                // msalInstance["browserStorage"].clear();
                msalInstance.loginRedirect({
                    redirectUri: "http://localhost:5501/"
                });
            });
    }
};
a();
