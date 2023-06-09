const { MTProto, getSRPParams } = require('@mtproto/core');
const prompts = require('prompts');

const api_id = 1537314 // insert api_id here
const api_hash = '1855b411a187811b71f333d904d725d9'; // insert api_hash here

async function getPhone() {
    return (await prompts({
        type: 'text',
        name: 'phone',
        message: 'Enter your phone number:'
    })).phone
}

async function getCode() {
    // you can implement your code fetching strategy here
    return (await prompts({
        type: 'text',
        name: 'code',
        message: 'Enter the code sent:',
    })).code
}

async function getPassword() {
    return (await prompts({
        type: 'text',
        name: 'password',
        message: 'Enter Password:',
    })).password
}


const mtproto = new MTProto({
    api_id,
    api_hash,
});

function startListener() {
    console.log('[+] starting listener')
    mtproto.updates.on('updates', ({ updates }) => {
        const newChannelMessages = updates.filter((update) => update._ === 'updateNewChannelMessage').map(({ message }) => message) // filter `updateNewChannelMessage` types only and extract the 'message' object

        for (const message of newChannelMessages) {
            // printing new channel messages
            console.log(`[${message.to_id.channel_id}] ${message.message}`)
        }
    });
}


// checking authentication status
console.log('aquii');
mtproto
    .call('users.getFullUser', {
        id: {
            _: 'inputUserSelf',
        },
    })
    .then(startListener) // means the user is logged in -> so start the listener
    .catch(async error => {

        // The user is not logged in
        console.log('[+] You must log in')
        const phone_number = await getPhone()

        mtproto.call('auth.sendCode', {
            phone_number: phone_number,
            settings: {
                _: 'codeSettings',
            },
        })
            .catch(error => {
                if (error.error_message.includes('_MIGRATE_')) {
                    const [type, nextDcId] = error.error_message.split('_MIGRATE_');

                    mtproto.setDefaultDc(+nextDcId);

                    return sendCode(phone_number);
                }
            })
            .then(async result => {
                return mtproto.call('auth.signIn', {
                    phone_code: await getCode(),
                    phone_number: phone_number,
                    phone_code_hash: result.phone_code_hash,
                });
            })
            .catch(error => {
                if (error.error_message === 'SESSION_PASSWORD_NEEDED') {
                    return mtproto.call('account.getPassword').then(async result => {
                        const { srp_id, current_algo, srp_B } = result;
                        const { salt1, salt2, g, p } = current_algo;

                        const { A, M1 } = await getSRPParams({
                            g,
                            p,
                            salt1,
                            salt2,
                            gB: srp_B,
                            password: await getPassword(),
                        });

                        return mtproto.call('auth.checkPassword', {
                            password: {
                                _: 'inputCheckPasswordSRP',
                                srp_id,
                                A,
                                M1,
                            },
                        });
                    });
                }
            })
            .then(result => {
                console.log('[+] successfully authenticated');
                // start listener since the user has logged in now
                startListener()
            });
    })