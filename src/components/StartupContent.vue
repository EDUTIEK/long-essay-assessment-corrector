<script setup>
import {ref, computed} from "vue";
import {stores} from "@/store";
import Welcome from "@/components/Welcome.vue";

const login = ref('');
const password = ref('');
const accepted = ref(false);

function showLogin() {
  stores.layout().showLogin = true;
  stores.layout().loginMessage = '';
}

function hideLogin() {
  stores.layout().showLogin = false;
}

function sendLogin() {
  stores.api().sendLogin(login.value, password.value);
}

function sendAgreement() {
  if (accepted.value) {
    stores.api().sendAgreement();
  }
}

function sendLogout() {
  stores.layout().showAgreement = false;
  stores.api().sendLogout();
}

const showReturnButton = computed(() => !!stores.api().returnUrl);
const showLoginButton = computed(() => !stores.api().returnUrl && !stores.api().userId);
const showLogoutButton = computed(() => !stores.api().returnUrl && stores.api().userId);

</script>

<template>
  <v-main fill-height>

    <v-app-bar elevation="1" color="white" density="compact">
      <v-app-bar-title v-show="stores.api().isLoading">{{ $t('startupContentLoadData') }}</v-app-bar-title>
      <v-app-bar-title v-show="stores.api().isSending">{{ $t('startupContentSendData') }}</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn v-if="showReturnButton" :href="stores.api().returnUrl">
        <v-icon left icon="mdi-logout-variant"></v-icon>
        <span>{{ $t('startupContentMyCorrections') }}</span>
      </v-btn>
      <v-btn v-if="showLoginButton" @click="showLogin">
        <v-icon left icon="mdi-login-variant"></v-icon>
        <span>{{ $t('startupContentLogin') }}</span>
      </v-btn>
      <v-btn v-if="showLogoutButton" @click="sendLogout">
        <v-icon left icon="mdi-logout-variant"></v-icon>
        <span>{{ $t('startupContentLogout') }}</span>
      </v-btn>
    </v-app-bar>

    <welcome/>

    <v-dialog max-width="60em" v-model="stores.layout().showLogin">
      <v-card>
        <v-form @submit.prevent="sendLogin">
          <v-card-title>
            {{ $t('startupContentLoginTitle') }}
          </v-card-title>
          <v-card-text>
            <v-alert v-if="stores.api().isSending" type="info" variant="text" color="#0000A0">
              {{ $t('startupContentSendLogin') }}
            </v-alert>
            <v-alert v-if="stores.layout().loginMessage" type="warning" variant="text" color="#0000A0">
              {{ stores.layout().loginMessage }}
            </v-alert>
            <v-text-field
                v-model="login"
                :label="$t('startupContentUserName')"
                name="login"
                autocomplete="username"
                @change="stores.layout().loginMessage = ''"
            ></v-text-field>
            <v-text-field
                v-model="password"
                :label="$t('startupContentPassword')"
                type="password"
                name="password"
                autocomplete="current-password"
                @change="stores.layout().loginMessage = ''"
            ></v-text-field>
            <v-btn type="submit" :color="stores.config().primaryColorCss">
              <span>{{ $t('startupContentLogin') }}</span>
            </v-btn>
          </v-card-text>
          <v-card-actions>

            <v-btn @click="hideLogin">
              <span>{{ $t('allCancel') }}</span>
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <v-dialog persistent  max-width="60em" v-model="stores.layout().showAgreement">
      <v-card>
        <v-form @submit.prevent="sendAgreement">
          <v-card-title>
            {{ $t('startupContentAgreementTitle') }}
          </v-card-title>
          <v-card-text>
            <v-alert v-if="!stores.user().accepted" type="warning" variant="text" color="#0000A0">
              {{ $t('startupContentAgreementMessage')}}
            </v-alert>

            <div class="agreement" v-html="stores.user().agreement"></div>

            <v-checkbox
                v-model="accepted"
                :label="$t('startupContentAgreementCheckbox')"
            ></v-checkbox>

            <v-btn type="submit" :disabled="!accepted" :color="stores.config().primaryColorCss">
              <span>{{ $t('startupContentAgreementButton') }}</span>
            </v-btn>
            <v-btn type="submit" @click="sendLogout">
              <span>{{ $t('startupContentLogout') }}</span>
            </v-btn>
          </v-card-text>
        </v-form>
      </v-card>
    </v-dialog>

    <v-dialog persistent  max-width="60em" v-model="stores.layout().hasInitFailure">
      <v-card>
        <v-card-title>
          {{ $t('startupContentLoadError') }}
        </v-card-title>
        <v-card-text>
          <v-alert type="warning" variant="text" color="#0000A0" >
            {{ stores.layout().initFailure }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-btn v-show="showReturnButton" :href="stores.api().returnUrl">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>{{ $t('allEnd') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog persistent  max-width="60em" v-model="stores.layout().showItemLoadFailure">
      <v-card>
        <v-card-text>
          <p>{{ $t('startupContentLoadItemError') }}</p>
        </v-card-text>
        <v-card-actions>
          <v-btn v-show="showReturnButton" :href="stores.api().returnUrl">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>{{ $t('allEnd') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-dialog persistent  max-width="60em" v-model="stores.layout().showDataReplaceConfirmation">
      <v-card>
        <v-card-text>
          <p>{{ $t('startupContentDataReplaceInfo1') }}</p>
          <p><strong>{{ stores.tasks().currentTitle }}: {{
              stores.items().getItem(stores.api().storedItemKey,
                  { key: 0, title: 'Unbekannt' }).title
            }}</strong></p>
          <p>{{ $t('startupContentDataReplaceInfo2') }}</p>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="stores.api().initAfterReplaceDataConfirmed">
            <v-icon left icon="mdi-reload"></v-icon>
            <span>{{ $t('startupContentDeleteAndLoad') }}</span>
          </v-btn>
          <v-btn v-show="showReturn" :href="stores.api().returnUrl">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>{{ $t('allCancel') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog persistent  max-width="60em" v-model="stores.layout().showItemReplaceConfirmation">
      <v-card>
        <v-card-text>
          <p>{{ $t('startupContentItemReplaceInfo1') }}</p>
          <p><strong>{{ stores.tasks().currentTitle }}: {{
              stores.items().getItem(stores.api().storedItemKey,
                  { key: 0, title: 'Unbekannt' }).title
            }}</strong></p>
          <p>{{ $t('startupContentItemReplaceInfo2') }}</p>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="stores.api().initAfterKeepDataConfirmed">
            <v-icon left icon="mdi-pencil-outline"></v-icon>
            <span>{{ $t('startupContentKeepLocalData') }}</span>
          </v-btn>
          <v-btn @click="stores.api().initAfterReplaceDataConfirmed">
            <v-icon left icon="mdi-trash-can-outline"></v-icon>
            <span>{{ $t('startupContentDeleteLocalData') }}</span>
          </v-btn>
          <v-btn v-show="showReturnButton" :href="stores.api().returnUrl">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>{{ $t('allCancel') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-main>
</template>


<style scoped>

  .agreement {
    padding: 1em;

  }
</style>
