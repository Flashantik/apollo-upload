<template>
  <v-container class="LoginWrapper">
    <v-card width="600px" light>
      <v-card-title class="coral white--text"> Вход </v-card-title>
      <v-form v-model="valid" @submit.prevent="login">
        <v-container>
          <v-row>
            <v-col cols="12">
              <!-- :rules="[
                  v => !!v || 'E-mail Должен быть введен',
                  v => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v) || 'E-mail должен быть валиден',
              ]"-->
              <v-text-field
                v-model="email"
                label="E-mail"
                required
                filled
                type="email"
              />
            </v-col>

            <v-col cols="12">
              <!-- v => /(?=.*[A-Z])/.test(v) || 'Must have one uppercase character',
                  v => /(?=.*\d)/.test(v) || 'Must have one number',
              v => /([!@$%])/.test(v) || 'Must have one special character [!@#$%]'-->
              <v-text-field
                v-model="password"
                filled
                label="password"
                :rules="[
                  (v) => !!v || 'Требуется пароль',
                  (v) =>
                    (v && v.length >= 3) ||
                    'Пароль должен содержать не менее 3 символов',
                ]"
                type="password"
                required
              />
            </v-col>
          </v-row>
        </v-container>
        <v-card-actions>
          <v-btn class="ml-auto" type="submit" :disabled="!valid">
            Войти
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-container>
</template>

<script>
import jwtDecode from 'jwt-decode'
import gql from 'graphql-tag'

export default {
  layout: 'empty',
  data() {
    return {
      email: '',
      password: '',
      valid: false,
    }
  },
  mounted() {
    if (this.$route.query.loginError === null) {
      this.$toast.error(
        'Пожалуйста авторизируйтесь чтобы получить доступ к данной странице'
      )
    }
  },
  methods: {
    login() {
      if (this.valid) {
        this.$nuxt.$loading.start()

        this.$apollo
          .mutate({
            mutation: gql`
              mutation AuthEmailLogin($email: String!, $password: String!) {
                AuthEmailLogin(email: $email, password: $password) {
                  jwt_refresh_token
                  jwt_token
                }
              }
            `,
            variables: {
              email: this.email,
              password: this.password,
            },
          })
          .then(({ data: { AuthEmailLogin } }) => {
            const decodedToken = jwtDecode(AuthEmailLogin.jwt_token)
            const decodedRefreshToken = jwtDecode(
              AuthEmailLogin.jwt_refresh_token
            )
            this.$cookies.set('apollo-token', AuthEmailLogin.jwt_token, {
              expires: new Date(+(decodedToken.exp + '000')),
              path: '/',
              
            })
            this.$cookies.set('refresh', AuthEmailLogin.jwt_refresh_token, {
              expires: new Date(+(decodedRefreshToken.exp + '000')),
              path: '/',
              
            })
            // this.$store.commit('user/set_user', login)
            this.$toast.success('Успешно авторизовано')
            this.$router.push('/')
          })
          .finally(() => {
            this.$nuxt.$loading.finish()
          })
      }
    },
  },
}
</script>

<style lang="scss">
.LoginWrapper {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
