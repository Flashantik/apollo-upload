import refreshToken from './refreshToken'

export default async ({ app, store }) => {
  await refreshToken({ app, store })
}
