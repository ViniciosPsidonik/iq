const { TelegramClient } = require('telegram')
const { StringSession } = require('telegram/sessions')
const input = require('input')

const { Logger } = require("telegram/extensions");
const { NewMessage } = require("telegram/events");
const { NewMessageEvent } = require("telegram/events/NewMessage");
const { DeletedMessage } = require("telegram/events/DeletedMessage");
const { EditedMessage } = require("telegram/events/EditedMessage");
const { Message } = require("telegram/tl/custom/message");

const apiId = 1537314;
const apiHash = "1855b411a187811b71f333d904d725d9";
const stringSession = new StringSession(""); // fill this later with the value from session.save()

async function eventPrint(event) {
    console.log('CreateD');
    const message = event.message;
    console.log(event);
    console.log('======================');
    // Checks if it's a private message (from user or bot)
    // if (event.isPrivate) {
    //     // prints sender id
    //     console.log(message.senderId);
    //     // read message
    //     if (message.text == "hello") {
    //         const sender = await message.getSender();
    //         console.log("sender is", sender);
    //         await client.sendMessage(sender, {
    //             message: `hi your id is ${message.senderId}`,
    //         });
    //     }
    // }
}

async function eventPrintE(event) {
    console.log('Edited');
    const message = event.message;
    console.log(event);
    console.log('======================');
    // Checks if it's a private message (from user or bot)
    // if (event.isPrivate) {
    //     // prints sender id
    //     console.log(message.senderId);
    //     // read message
    //     if (message.text == "hello") {
    //         const sender = await message.getSender();
    //         console.log("sender is", sender);
    //         await client.sendMessage(sender, {
    //             message: `hi your id is ${message.senderId}`,
    //         });
    //     }
    // }
}

async function eventPrintD(event) {

    console.log('Deleted');
    const message = event.message;
    console.log(event);
    console.log('======================');
    // UpdateEditChannelMessage
    // Checks if it's a private message (from user or bot)
    // if (event.isPrivate) {
    //     // prints sender id
    //     console.log(message.senderId);
    //     // read message
    //     if (message.text == "hello") {
    //         const sender = await message.getSender();
    //         console.log("sender is", sender);
    //         await client.sendMessage(sender, {
    //             message: `hi your id is ${message.senderId}`,
    //         });
    //     }
    // }
}


(async () => {
    console.log("Loading interactive example...");
    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });
    await client.start({
        phoneNumber: '+5554992563317',
        password: async () => await input.text("Please enter your password: "),
        phoneCode: async () =>
            await input.text("Please enter the code you received: "),
        onError: (err) => console.log(err),
    });
    console.log("You should now be connected.");
    console.log(client.session.save()); // Save this string to avoid logging in again
    await client.sendMessage("me", { message: "Hello!" });

    client.addEventHandler(eventPrint, new NewMessage({}))
    client.addEventHandler(eventPrintD, new DeletedMessage({}))
    client.addEventHandler(eventPrintE, new EditedMessage({}))

})();