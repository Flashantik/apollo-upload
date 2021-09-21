// import refreshMyToken from '~/plugins/refreshToken'
export default function (context) {
  const hasToken =
    !!context.app.$cookies.get('apollo-token', {
      path: '/',
      
    }) ||
    context.app.$cookies.get('refresh', {
      path: '/',
      
    })
  if (
    context.route.name !== 'registration' &&
    context.route.name !== 'recovery' &&
    context.route.name !== 'login'
  ) {
    if (!hasToken) {
      return context.redirect('/login?loginError')
    }
  } else if (hasToken) {
    context.redirect('/')
  }
}
