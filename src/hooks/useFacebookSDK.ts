import { useState, useEffect } from 'react';

const FACEBOOK_APP_ID = '1154555155575509';

declare global {
    interface Window {
        FB: any;
        fbAsyncInit: () => void;
    }
}

namespace fb {
    export interface StatusResponse {
        status: string;
        authResponse: {
            accessToken: string;
            expiresIn: string;
            signedRequest: string;
            userID: string;
        };
    }
}

export const useFacebookSDK = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (window.FB) {
            setIsLoaded(true);
            return;
        }

        const loadSDK = () => {
            // @ts-ignore
            window.fbAsyncInit = function () {
                // @ts-ignore
                window.FB.init({
                    appId: FACEBOOK_APP_ID,
                    cookie: true,
                    xfbml: true,
                    version: 'v24.0'
                });
                setIsLoaded(true);
            };

            (function (d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) return;
                js = d.createElement(s) as HTMLScriptElement;
                js.id = id;
                js.src = "https://connect.facebook.net/pt_BR/sdk.js";
                if (fjs && fjs.parentNode) {
                    fjs.parentNode.insertBefore(js, fjs);
                } else {
                    d.head.appendChild(js);
                }
            }(document, 'script', 'facebook-jssdk'));
        };

        loadSDK();
    }, []);

    const login = (scope: string = 'public_profile,email,ads_read,leads_retrieval,pages_show_list,pages_read_engagement') => {
        return new Promise<fb.StatusResponse>((resolve, reject) => {
            if (!window.FB) return reject('Facebook SDK not loaded');

            window.FB.login((response) => {
                if (response.authResponse) {
                    resolve(response);
                } else {
                    reject('User cancelled login or did not fully authorize.');
                }
            }, { scope });
        });
    };

    const getAdAccounts = () => {
        return new Promise<any[]>((resolve, reject) => {
            if (!window.FB) return reject('Facebook SDK not loaded');

            // Fetch businesses or directly ad accounts
            window.FB.api('/me/adaccounts', { fields: 'name,account_id,id,currency,account_status' }, (response: any) => {
                if (response.error) return reject(response.error);
                resolve(response.data || []);
            });
        });
    };

    return { isLoaded, login, getAdAccounts };
};
