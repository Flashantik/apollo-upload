import imageCompression from 'browser-image-compression'
export default {
  methods: {
    compressImage(file, options = { maxSizeMB: 3, maxWidthOrHeight: 1920 }) {
      return imageCompression(file, options)
    }
  }
}
