var isPushEnabled = false,
    subBtn,
    registration;

window.addEventListener('load', function () {
        subBtn = document.getElementById('webpush-subscribe-button');

        subBtn.addEventListener('click',
            function () {
                subBtn.classList.add("disabled");
                if (isPushEnabled) {
                    return unsubscribe()
                }

                // Do everything if the Browser Supports Service Worker
                if ('serviceWorker' in navigator) {
                    var serviceWorker = document.querySelector('meta[name="service-worker-js"]').content;
                    navigator.serviceWorker.register(serviceWorker)
                        .then(
                            function (reg) {
                                console.log('Loading....');
                                registration = reg;
                                initialiseState(reg);
                            }
                        );
                }
                // If service worker not supported, show warning to the message box
                else {
                    console.log('Service Worker is not supported in your Browser!');
                }
            }
        );

        // Once the service worker is registered set the initial state
        function initialiseState(reg) {
            // Are Notifications supported in the service worker?
            if (!(reg.showNotification)) {
                // Show a message and activate the button
                console.log('Showing Notification is not suppoted in your browser');
                console.log('Subscribe to Push Messaging');
                return;
            }

            // Check the current Notification permission.
            // If its denied, it's a permanent block until the
            // user changes the permission
            if (Notification.permission === 'denied') {
                // Show a message and activate the button
                console.log('The Push Notification is blocked from your browser.');
                console.log('Subscribe to Push Messaging');
                subBtn.classList.remove("disabled");
                return;
            }

            // Check if push messaging is supported
            if (!('PushManager' in window)) {
                // Show a message and activate the button
                console.log('Push Notification is not available in the browser');
                console.log('Subscribe to Push Messaging');
                subBtn.classList.remove("disabled");
                return;
            }

            // We need to subscribe for push notification and send the information to server
            subscribe(reg)
        }
    }
);


function subscribe(reg) {
    // Get the Subscription or register one
    getSubscription(reg).then(
        function (subscription) {
            postSubscribeObj('subscribe', subscription);
        }
    )
        .catch(
            function (error) {
                console.log('Subscription error.', error)
            }
        )
}

function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function getSubscription(reg) {
    return reg.pushManager.getSubscription().then(
        function (subscription) {
            var metaObj, applicationServerKey, options;
            // Check if Subscription is available
            if (subscription) {
                return subscription;
            }

            metaObj = document.querySelector('meta[name="django-webpush-vapid-key"]');
            applicationServerKey = metaObj.content;
            options = {
                userVisibleOnly: true
            };
            if (applicationServerKey) {
                options.applicationServerKey = urlB64ToUint8Array(applicationServerKey)
            }
            // If not, register one
            return registration.pushManager.subscribe(options)
        }
    )
}

function unsubscribe() {
    // Get the Subscription to unregister
    registration.pushManager.getSubscription()
        .then(
            function (subscription) {

                // Check we have a subscription to unsubscribe
                if (!subscription) {
                    // No subscription object, so set the state
                    // to allow the user to subscribe to push
                    subBtn.classList.remove("disabled");
                    console.log('Subscription is not available');
                    return;
                }
                postSubscribeObj('unsubscribe', subscription);
            }
        )
}

function postSubscribeObj(statusType, subscription) {
    // Send the information to the server with fetch API.
    // the type of the request, the name of the user subscribing,
    // and the push subscription endpoint + key the server needs
    // to send push messages

    var browser = navigator.userAgent.match(/(firefox|msie|chrome|safari|trident)/ig)[0].toLowerCase(),
        data = {
            status_type: statusType,
            subscription: subscription.toJSON(),
            browser: browser,
            group: subBtn.dataset.group
        };

    fetch(subBtn.dataset.url, {
        method: 'post',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
        credentials: 'include'
    })
        .then(
            function (response) {
                // Check the information is saved successfully into server
                if ((response.status == 201) && (statusType == 'subscribe')) {
                    // Show unsubscribe button instead
                    console.log('Unsubscribe to Push Messaging');
                    subBtn.classList.remove("disabled");
                    isPushEnabled = true;
                    console.log('Successfully subscribed for Push Notification');
                }

                // Check if the information is deleted from server
                if ((response.status == 202) && (statusType == 'unsubscribe')) {
                    // Get the Subscription
                    getSubscription(registration)
                        .then(
                            function (subscription) {
                                // Remove the subscription
                                subscription.unsubscribe()
                                    .then(
                                        function (successful) {
                                            console.log('Subscribe to Push Messaging');
                                            console.log('Successfully unsubscribed for Push Notification');
                                            isPushEnabled = false;
                                            subBtn.classList.remove("disabled");
                                        }
                                    )
                            }
                        )
                        .catch(
                            function (error) {
                                console.log('Unsubscribe to Push Messaging');
                                console.log('Error during unsubscribe from Push Notification');
                                subBtn.classList.remove("disabled");
                            }
                        );
                }
            }
        )
}