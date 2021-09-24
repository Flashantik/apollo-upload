<template>
  <div class="progressCircle">
    <span class="progressCircle__percentage">
      {{ progress }} %
    </span>
    <svg :height="radius * 2" :width="radius * 2">
      <circle :stroke="strokeColor" :fill="fill" :stroke-dasharray="circumference + ' ' + circumference"
        :style="{ strokeDashoffset }" :stroke-width="stroke" :r="normalizedRadius" :cx="radius" :cy="radius" />
    </svg>
  </div>
</template>

<script>
  export default {
    props: {
      radius: {
        type: Number,
        default: 100
      },
      progress: {
        type: Number,
        default: 0
      },
      stroke: {
        type: Number,
        default: 10
      },
      fill: {
        type: String,
        default: 'transparent'
      },
      strokeColor: {
        type: String,
        default: 'white'
      }
    },
    data() {
      const normalizedRadius = this.radius - this.stroke * 2;
      const circumference = normalizedRadius * 2 * Math.PI;

      return {
        normalizedRadius,
        circumference
      };
    },
    computed: {
      strokeDashoffset() {
        return this.circumference - this.progress / 100 * this.circumference;
      }
    }
  }

</script>

<style scoped lang="scss">
  .progressCircle {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: opacity .4s ease;

    .progressCircle__percentage {
      mix-blend-mode: difference;
      color: rgb(0, 255, 255);
      position: absolute;
      font-size: 1em;
      font-weight: 800;
    }

    circle {
      transition: stroke-dashoffset 0.35s, ;
      transform: rotate(-90deg);
      transform-origin: 50% 50%;
    }
  }

</style>
