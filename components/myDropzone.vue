<template>
  <div class="MyDropzone" :disabled="disabled">
    <input
      ref="inputFile"
      class="d-none"
      type="file"
      :accept="accept"
      :disabled="disabled"
      @input="addFiles($event.target.files)"
    />
    <div
      ref="MyDropzone"
      class="MyDropzone__addFile d-flex align-center justify-center h-100"
      :style="{
        'justify-content': value && value.length == 0 ? 'center' : ''
      }"
      :class="{
        success: state === true,
        error: state === false
      }"
      @click="$refs.inputFile.click()"
    >
      <div
        v-for="(file, fileKey) in value"
        :key="`file_${fileKey}`"
        :style="{
          width: size.width,
          height: size.height
        }"
        class="MyDropzone__file"
      >
      <div v-if="file.upload.isLoading" style="position: absolute;"> 
        <app-progress-circle  fill="black" :progress="file.upload.progress" :radius="70" :stroke="10"/>
      </div>

        <div v-if="!file.progress" class="MyDropzone__fileActions">
          <button
            v-if="editable"
            :disabled="disabled"
            @click.stop.prevent="$emit('file:edit', { file, index: fileKey })"
          >
            <i class="mdi mdi-edit-pencil" />
          </button>
          <button @click.stop.prevent="removeFile(fileKey)">
            <i class="mdi mdi-delete" :disabled="disabled" />
          </button>
        </div>
        <div v-if="file.status" class="MyDropzone__status">
          {{ file.status }}
        </div>
        <img
          :src="file.base64"
          :alt="file.name"
          @error="replaceByDefault($event)"
        />
      </div>
      <div
        v-if="multiple || (value && value.length == 0)"
        class="MyDropzone__plus"
        :style="{
          width: size.width,
          height: size.height
        }"
      />
    </div>
    <div class="field__help">
      <div>
        <div v-if="state === false" class="error--text">
          <slot name="errorMessage" />
        </div>
        <transition name="slide-y">
          <div class="input-content__hint">
            {{ hint }}
          </div>
        </transition>
      </div>
      <span
        v-if="counter"
        class="input-content__counter"
        :class="{ 'error--text': value && value.length > counter }"
      >
        {{ value && value.length }} / {{ counter }}
      </span>
    </div>
    <v-dialog
      v-model="cropperDialog"
      width="600"
      content-class="myDialog"
      overlay-color="#253250"
      overlay-opacity="0.4"
    >
      <v-card tile flat>
        <v-card-title>Выберите область</v-card-title>
        <v-card-text>
          <my-crooper
            v-if="croppImage && imageToCropp"
            v-model="imageToCropp"
            :aspect-ratio="aspectRatio"
          ></my-crooper>
          <slot name="cropper" />
        </v-card-text>
        <v-card-actions>
          <v-btn class="moderateBtn" text @click="croppend(imageToCropp)">
            <span>подвтердить</span>
          </v-btn>
          <v-btn class="ml-5" outlined @click="cropperDialog = false">
            <span>Отменить</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  <v-btn @click="uploadQueue()">Загрузить</v-btn>
  </div>
</template>

<script>

import gql from 'graphql-tag'
import { v4 as UUIDv4 } from 'uuid'
import vuelidate from '~/mixins/vuelidate'
import progress from '~/components/progress'
/*
  events
  ______
  input: [File]
  file:added: File
  file:edit: File
  file:removed: File
  error:fileExtension
  error:maxFilesReached

*/
const toBase64 = File =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(File)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
export default {
  components:{appProgressCircle: progress},
  mixins: [vuelidate],
  props: {
    value: {
      type: Array,
      default: () => []
    },
    editable: {
      type: Boolean,
      default: false
    },
    croppImage: {
      type: Boolean
    },
    aspectRatio: {
      type: Number,
      default: NaN
    },
    accept: {
      type: String,
      default: '*'
    },
    maxFiles: {
      type: [Number, String],
      default: 100
    },
    size: {
      type: Object,
      default: () => {
        return {
          width: '100px',
          height: '100px'
        }
      }
    },
    disabled: {
      type: Boolean
    },
    hint: {
      type: String,
      default: ''
    },
    counter: {
      type: Boolean
    }
  },
  data() {
    return {
      showMenu: false,
      imageToCropp: null,
      croppKey: null,
      cropperDialog: false
    }
  },
  computed: {
    queue(){
      return this.value.filter((file)=> {
        return !file.upload?.isUploaded
      })
    },
    multiple() {
      return this.maxFiles > 1
    },
    fieldType() {
      const { type, stateHide } = this
      if (type === 'password' && !stateHide) {
        return 'text'
      }
      return type
    },
    arrayLength() {
      return this.value?.length
    }
  },
  watch: {
    arrayLength: {
      handler() {
        if (this.value) {
          this.$emit(
            'input',
            this.value.map(el => {
              if (!el.base64 && el.image) {
                el.base64 = el.image
              }
              return el
            })
          )
          if (this.$refs.inputFile) {
            this.$refs.inputFile.value = ''
          }
        }
      },
      immediate: true
    }
  },
  mounted() {
    ;[
      'drag',
      'dragstart',
      'dragend',
      'dragover',
      'dragenter',
      'dragleave',
      'drop'
    ].forEach(
      function(evt) {
        this.$refs.MyDropzone?.addEventListener(
          evt,
          function(e) {
            e.preventDefault()
            e.stopPropagation()
          },
          false
        )
      }.bind(this)
    )
    this.$refs.MyDropzone?.addEventListener('drop', async e => {
      await this.addFiles(e.dataTransfer.files)
    })
  },
  methods: {
    uploadQueue() {
      this.$nuxt.$loading.start()
      Promise.all(
        this.queue.map(file => {
          file.upload.isLoading = true
          return this.$apollo.mutate({
            mutation: gql`
              mutation imageUpload($file: Upload!) {
                imageUpload(file: $file, bucket: "newruvita") {
                  url
                }
              }
            `,
            context: {
              fetchOptions: {
                useUpload: true,
                onProgress: (ev) => {
                  file.upload.progress = Math.round((ev.loaded / ev.total) * 100)
                },
              }
            },
            variables: {
              file: file.file
            }
          }).then(()=> {
          this.$toast.success(`Файл: ${file.file.name} загружен!`)
          this.$set(file.upload, 'isUploaded', true)
          }).catch((error)=> {
            file.upload.error = error
          }).finally(()=> {file.upload.isLoading = false})
        })
      ).finally(() => {
        this.$nuxt.$loading.finish()
      }
      )
    },
    openDialog() {
      this.cropperDialog = true
    },
    closeDialog() {
      this.cropperDialog = false
    },
    croppend(file) {
      const newArray = [...this.value]
      newArray[this.croppKey] = file
      this.$emit('input', newArray)
      this.$emit('file:added', newArray[this.croppKey])
      this.cropperDialog = false
      this.croppKey = null
      this.imageToCropp = null
    },
    replaceByDefault(e) {
      e.target.src = require('~/assets/images/file.png')
    },
    addImageToArray(file) {
      const newArray = [...this.value]
      newArray.push(file)
      this.$emit('input', newArray)
      this.$emit('file:added', newArray[newArray?.length - 1])
      return true
    },
    addFiles(files) {
      files.forEach(async file => {
         const myFile = JSON.parse(JSON.stringify(file))
        if (file) {
          if (this.value?.length < this.maxFiles) {
            this.$emit('file:removed')
          }
          if (
            new RegExp(
              '(' +
              this.accept
              .replace(/\s/g, '')
              .replace(/,/g, '|')
              .replace(/\*/g, '.*')
              .replace(/\\./g, '\\.') +
              ')$'
            ).test(file.name)
          ) {
            // проверка на расширение файла
            myFile.base64 = await toBase64(file)
            myFile.file = file
            myFile.upload = {
              id: UUIDv4(),
              progress: 0,
              isLoading: false,
              error: null
            }
            if (!this.croppImage) {
              return this.addImageToArray(myFile)
            } else {
              this.imageToCropp = myFile
              this.croppKey = this.value.length
              this.$nextTick(() => {
                this.cropperDialog = true
              })
            }
          } else {
            this.$emit('error:fileExtension')
            this.$toast.error('Неверный формат файла')
          }
        }
      })
    },
    removeFile(fileKey) {
      const newArray = [...this.value]
      const deletedEl = newArray.splice(fileKey, 1)[0]
      this.$emit('input', newArray)
      this.$emit('file:removed', deletedEl)
      this.$nextTick(() => {
        // touch input file for delete previus image
        this.$refs.inputFile.value = ''
      })
    }
  }
}
</script>

<style lang="scss">
.MyDropzone {
  .d-none {
    display: none;
  }
  display: inline-block;
  .MyDropzone__addFile {
    position: relative;
    padding: 20px;
    border: 1px dashed #b3bcc7;
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    align-items: center;
    transition: 300ms;
    &:hover {
      border-color: #0066c0;
    }
    cursor: pointer;
    .MyDropzone__plus {
      border: 1px dashed #b3bcc7;
      width: 80px;
      height: 80px;
      position: relative;
      transition: 300ms;
      &:before,
      &:after {
        content: '';
        display: block;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 30px;
        height: 4px;
        background: #b3bcc7;
        transition: 300ms;
      }
      &:after {
        transform: translate(-50%, -50%) rotate(90deg);
      }
    }
    .MyDropzone__file {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: initial;
      img {
        max-width: 100%;
        height: auto;
      }
      .progressCircle{
        opacity: 0.5;
      }
      &:hover .MyDropzone__fileActions, &:hover .progressCircle {
        opacity: 1;
      }
      .MyDropzone__status {
        position: absolute;
        height: 25px;
        border-radius: 50px;
        padding: 8px;
        text-align: center;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        right: 10px;
        top: 10px;
      }
      .MyDropzone__fileActions {
        position: absolute;
        right: 5px;
        bottom: 5px;
        opacity: 0.5;
        transition: opacity 0.3s ease;
        button {
          border: 0;
          width: 30px;
          height: 30px;
          background-color: #ff4f36;
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 4px;
          color: #ffffff;
        }
      }
    }
  }
}

</style>

