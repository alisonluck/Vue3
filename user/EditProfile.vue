<template>
	<q-page>
		<q-btn label="Update Email" @click="updateEmail = true" />
		<q-btn label="Change Password" @click="changePassword = true" />

		<q-dialog v-model="updateEmail">
		  <EmailPopup @close="updateEmail = false" />
		</q-dialog>
		<q-dialog v-model="changePassword">
		  <PasswordPopup @close="changePassword = false" />
		</q-dialog>
	</q-page>
</template>

<script>
export default {
	name: 'EditProfile',
	data () {
		return {
			updateEmail: false,
			changePassword: false
		}
	},
	components: {
		EmailPopup: require('../../components/popups/EmailPopup.vue').default,
		PasswordPopup: require('../../components/popups/PasswordPopup.vue').default,
	}
}
</script>