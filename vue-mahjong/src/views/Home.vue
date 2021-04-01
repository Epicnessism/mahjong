<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png" />
    <Login v-if="loggedIn" msg="Please Login!!!!!" />
    <HelloWorld msg="Welcome to Your Vue.js + TypeScript App" />
    <v-btn @click="toggleLogin()">
      Toggle Login view
    </v-btn>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import HelloWorld from "@/components/HelloWorld.vue"; // @ is an alias to /src
import Login from "@/components/Login.vue"

@Options({
  components: {
    HelloWorld,
    Login,
  },
})
export default class Home extends Vue {
  loggedIn = false;

  toggleLogin() {
    this.loggedIn = !this.loggedIn
  }
}
</script>
