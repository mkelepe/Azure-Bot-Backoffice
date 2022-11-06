const msalConfig = {
    auth: {
        clientId: "42f7b561-1c6f-451f-b1f0-ae82cd705e02",
        authority: "https://login.microsoftonline.com/d00244c0-5012-477e-a93b-96150bb780cf",
      }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

const authenticate = async () => {
    const redirectResponse = await msalInstance.handleRedirectPromise();
    if (redirectResponse !== null) {
        let accessToken = redirectResponse.accessToken;
        // console.log(accessToken);
        verifyToken(accessToken);
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
                let accessToken = accessTokenResponse.accessToken;
                // console.log(accessToken);
                verifyToken(accessToken);
            })
            .catch(function (error) {
                // msalInstance["browserStorage"].clear();
                msalInstance.loginRedirect();
            });
    }
};

const logout = async () => {
    const logoutRequest = {
        account: msalInstance.getAccountByHomeId(),
    };
    msalInstance.logoutRedirect(logoutRequest);
}

authenticate();
