export default {
  props: {
    vuelidate: {
      type: [Boolean, String],
      default: false,
    },
  },
  computed: {
    state() {
      if (this.vuelidate) {
        let expression =
          typeof this.vuelidate === 'string'
            ? this.vuelidate
            : this.$vnode.data?.model?.expression
        try {
          expression = expression.replace(/\s/g, '')
          const field = expression
            .split('.')
            .reduce(
              (object, property) => object[property],
              this.$vnode.context?.$v
            )

          const { $dirty, $invalid } = field // Проверка полей только после неудавшейся валидации формы
          return $dirty ? !$invalid : null
        } catch {
          console.error(
            'Не найдено поле валидации у родительского компонента с полем: ',
            expression
          )
        }
      } else {
        return null
      }
    },
  },
}
