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

            console.log('[Meta SDK] Starting login with scopes:', scope);
            window.FB.login((response) => {
                console.log('[Meta SDK] Login response:', response);
                if (response.authResponse) {
                    resolve(response);
                } else {
                    reject('O usuário cancelou o login ou não autorizou completamente.');
                }
            }, { scope, auth_type: 'rerequest' });
        });
    };

    const getAdAccounts = () => {
        return new Promise<any[]>((resolve, reject) => {
            if (!window.FB) return reject('Facebook SDK not loaded');

            console.log('[Meta SDK] Fetching ad accounts...');
            // Fetch businesses or directly ad accounts
            window.FB.api('/me/adaccounts', { fields: 'name,account_id,id,currency,account_status' }, (response: any) => {
                console.log('[Meta SDK] Ad accounts response:', response);
                if (response.error) {
                    const errorMsg = response.error.message || 'Erro desconhecido ao buscar contas de anúncio';
                    console.error('[Meta SDK] Error details:', response.error);

                    if (errorMsg.includes('appsecret_proof')) {
                        return reject('Configuração de Segurança do Facebook: Desative "Exigir segredo do aplicativo" (App Secret Proof) no painel do desenvolvedor.');
                    }

                    return reject(errorMsg);
                }
                resolve(response.data || []);
            });
        });
    };

    const verifyPermissions = () => {
        return new Promise<any[]>((resolve, reject) => {
            if (!window.FB) return reject('Facebook SDK not loaded');

            window.FB.api('/me/permissions', (response: any) => {
                console.log('[Meta SDK] Permissions check:', response);
                if (response.error) return reject(response.error);
                resolve(response.data || []);
            });
        });
    };

    return { isLoaded, login, getAdAccounts, verifyPermissions };
};
