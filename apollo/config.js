import { onError } from 'apollo-link-error'
// import { createHttpLink } from 'apollo-link-http'
import { createUploadLink } from 'apollo-upload-client'
import { ApolloLink } from 'apollo-link'
import cookie from 'cookie'
import { uploadFetch } from "./uploadHelper"
import refreshToken from '~/plugins/refreshToken'


export default function(context) {
  const { app, req, store } = context
  const errorLink = onError(error => {
    if (context.app.$sentry) {
      context.app.$sentry.captureException(error)
    }
    const { graphQLErrors, networkError, operation } = error
    if (operation?.variables?.ignoreError !== true) {
      if (graphQLErrors) {
        graphQLErrors.forEach(({ code, message, locations, path }) => {
          if (context.app.$toast) {
            context.app.$toast.error(message)
          }
          if (code === 401) {
            refreshToken({ app: context.app, store: context.store }).catch(
              () => {
                if (context.app.$sentry) {
                  context.app.$sentry.captureException(
                    new Error('Ошибка авторизации !')
                  )
                }
              }
            )
          } else if (code === 403) {
            if (context.app.$sentry) {
              context.app.$sentry.captureException(new Error(message))
            }
          }
        })
      }

      if (networkError) {
        const message = networkError.message.split(': ')
        if (message[1] === 'Received status code 401') {
          refreshToken({ app: context.app, store: context.store })
        } else {
          const errorText = 'Произошла сетевая ошибка. Сервер недоступен'
          console.error(networkError.message)
          if (
            context.app?.$toast &&
            !context.app?.$toast?.toasts?.some(
              el => el?.el?.textContent === errorText
            )
          ) {
            context.app?.$toast?.error(errorText)
          }
        }
      }
    }
  })

  let activeRefresh = null
  const customFetch = async (uri, options) => {
    if (
      !context.$cookies.get('apollo-token') &&
      context.$cookies.get('refresh')
    ) {
      if (!activeRefresh) {
        activeRefresh = refreshToken({ app, store })
      } else {
        await activeRefresh
        activeRefresh = null
      }
    }
    if (options.useUpload) {
      return uploadFetch(uri, options)
    }
    return fetch(uri, options);
  }

  const uploadLink = createUploadLink({
    uri: "http://localhost:4000/graphql",
    fetch: typeof window === 'undefined' ? global.fetch : customFetch
  })
  return {
    link: ApolloLink.from([errorLink, uploadLink]),
    httpLinkOptions: {
      credentials: 'same-origin'
    },
    defaultHttpLink: false,
    deep: true,
    $query: {
      deep: true
    },
    defaultOptions: {
      // apollo options applied to all queries in components
      deep: true,
      $query: {
        deep: true,
        fetchPolicy: 'cache-and-network'
      }
    },
    getAuth: () => {
      const token = req
        ? cookie.parse(req?.headers?.cookie || '')['apollo-token']
        : app.$cookies.get('apollo-token', {
            path: '/'
          })
      return token ? `bearer ${token}` : ''
    }
  }
}
