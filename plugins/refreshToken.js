import jwtDecode from 'jwt-decode'

let hasActiveRefreshSession = false
export default ({ app, store }) => {
  const refreshToken = app.$cookies.get('refresh', {

  })
  const promise = new Promise((resolve, reject) => {
    if (!hasActiveRefreshSession) {
      if (refreshToken) {
        hasActiveRefreshSession = true
        fetch("http://localhost:4000/graphql", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: `
            mutation RefreshLogin  ($refreshToken: String!){
              RefreshLogin(jwt_refresh_token: $refreshToken) {
                jwt_refresh_token
                jwt_token
              }
            }
          `,
            operationName: null,
            variables: {
              refreshToken
            }
          })
        })
          .then(response => {
            response.json().then(refreshJson => {
              if (refreshJson.errors?.length > 0) {
                reject(refreshJson.errors)
                store.commit('user/serv_user', null)
                app.$cookies.remove('apollo-token', {
                  path: '/',

                })
                app.$cookies.remove('refresh', {
                  path: '/',

                })
              } else {
                // delete user.refresh_token
                // TODO
                // store.commit('user/serv_user', user)

                const RefreshLogin = refreshJson.data?.RefreshLogin

                const decodedToken = jwtDecode(RefreshLogin.jwt_token)
                const decodedRefreshToken = jwtDecode(
                  RefreshLogin.jwt_refresh_token
                )

                app.$cookies.set('apollo-token', RefreshLogin.jwt_token, {
                  expires: new Date(+(decodedToken.exp + '000')),
                  path: '/',

                })
                app.$cookies.set('refresh', RefreshLogin.jwt_refresh_token, {
                  expires: new Date(+(decodedRefreshToken.exp + '000')),
                  path: '/',

                })
                resolve(refreshJson)
              }
              hasActiveRefreshSession = false
            })
          })
          .catch(error => {
            hasActiveRefreshSession = false
            reject(error)
            app.$cookies.remove('refresh', {
              path: '/',

            })
            app.$cookies.remove('apollo-token', {
              path: '/',

            })
          })
      } else {
        resolve('Нет refresh токена')
      }
    } else {
      resolve('Есть активная refresh сессия')
    }
  })
  return promise
}
