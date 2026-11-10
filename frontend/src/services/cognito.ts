import { Amplify } from "aws-amplify";

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID as string | undefined;
const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined;

export const hasCognitoConfig = Boolean(userPoolId && userPoolClientId);

if (hasCognitoConfig) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: userPoolId!,
        userPoolClientId: userPoolClientId!,
        loginWith: { email: true },
      },
    },
  });
} else {
  console.warn("Configure VITE_COGNITO_USER_POOL_ID e VITE_COGNITO_CLIENT_ID para ativar o login.");
}
