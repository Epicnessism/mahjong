<template>
  <div class="loginButton">
    <v-btn @click="login()">
        Login
    </v-btn>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import axios from 'axios';

@Options({
  props: {
    msg: String,
  },
})
export default class LoginButton extends Vue {
  msg!: string;
  password: string = "";
  promptUsername: string = "";

  signIn() {
    axios
    .post('/signIn', {
      username: this.promptUsername,
      password: this.password
    }
    )
    .then( function(response) {
      console.log(response.data);
      if(response.data.username) {
        console.log("You have been signed in as " + response.data.username);
        // app.username = response.data.username
        // app.signedIn = true
      }
    })
    .catch( function(error) {
      console.log(error);
    })
    this.password = '' //do this immediately after the http request is sent out
  }

}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
