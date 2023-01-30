import {
  storageAuthTokenGet,
  storageAuthTokenSave,
} from "@storage/storageAuthToken";
import { AppError } from "@utils/AppError";
import axios, { AxiosInstance } from "axios";

type SignOut = () => void;

type PromiseType = {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
};

type ProcessQueueParams = {
  error: Error | null;
  token: string | null;
};

type APIInstanceProps = AxiosInstance & {
  registerInterceptorTokenManager: (signOut: SignOut) => () => void;
};

export const api = axios.create({
  baseURL: "http://localhost:3333",
}) as APIInstanceProps;

let isRefreshing = false;
let failedQueue: Array<PromiseType> = [];

// Método para percorrer a fila de requisições e processar
const processQueue = ({ error, token }: ProcessQueueParams) => {
  failedQueue.forEach((request) => {
    if (error) {
      request.reject(error);
    } else {
      request.resolve(token);
    }
  });

  failedQueue = [];
};

api.registerInterceptorTokenManager = (signOut) => {
  const interceptorTokenManager = api.interceptors.response.use(
    (response) => response,
    async (requestError) => {
      if (requestError?.response?.status === 401) {
        // validando se a mensagem de erro é de token expirado ou inválido (não autorizado)
        if (
          requestError.response.data?.message === "token.expired" ||
          requestError.response.data?.message === "token.invalid"
        ) {
          const oldToken = await storageAuthTokenGet();
          // caso não possui o token salvo na storage o usuário será deslogado
          if (!oldToken) {
            signOut();
            return Promise.reject(requestError);
          }

          const originalRequest = requestError.config;

          // Caso o token esteja sendo renovado, vai adicionar o fila a requisição do usuário
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers["Authorization"] = `Bearer ${token}`;
                return axios(originalRequest);
              })
              .catch((error) => {
                throw error;
              });
          }
          isRefreshing = true;

          // Salvando o token renovado na storage
          return new Promise(async (resolve, reject) => {
            try {
              const { data } = await api.post("/sessions/refresh-token", {
                token: oldToken,
              });

              await storageAuthTokenSave(data.token);

              api.defaults.headers.common[
                "Authorization"
              ] = `Bearer ${data.token}`;

              originalRequest.headers["Authorization"] = `Bearer ${data.token}`;

              processQueue({ error: null, token: data.token });

              resolve(originalRequest);
            } catch (error: any) {
              processQueue({ error, token: null });
              signOut();
              reject(error);
            } finally {
              isRefreshing = false;
            }
          });
        }

        // caso o retorno do error não seja de token expirado ou inválido, o usuário é deslogado
        signOut();
      }

      if (requestError.response && requestError.response.data) {
        return Promise.reject(new AppError(requestError.response.data.message));
      } else {
        return Promise.reject(requestError);
      }
    }
  );

  return () => {
    api.interceptors.response.eject(interceptorTokenManager);
  };
};
