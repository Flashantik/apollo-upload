<template>
  <div>
    <my-dropzone v-model="files" />
  </div>
</template>

<script>
export default {
  data() {
  return {
    files: []
  };
}
}
</script>
