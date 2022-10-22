export type Credential = {
  accessToken: string;
  refreshToken: string;
};

export type CredentialUser = Credential & {
  id: string;
  username: string;
  roles: string[];
};

export type TokenPayload = {
  id: string;
};
