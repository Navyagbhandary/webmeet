window.addEventListener("load", function()
{
    if (config.uport)
    {
        var clientId = "2p1psGHt9J5NBdPDQejSVhpsECXLxLaVQSo";
        var permission = "Wa1l7M9NoGwcxxdX";
        var server = config.bosh_service_url.split("/")[2];

        var url = "https://" + server + "/rest/api/restapi/v1/ask/uport/pade/" + clientId;
        var options = {method: "GET", headers: {"authorization": permission}};

        fetch(url, options).then(function(response){ return response.text()}).then(function(signer)
        {
            //console.log("Signer", signer);

            window.uport = new uportconnect.Connect("Pade", {clientId: clientId, signer: uportconnect.SimpleSigner(signer)});

            window.uport.requestCredentials({notifications: true, verified: ['registration'], requested: ['name', 'email', 'phone', 'country', 'avatar']}).then((credentials) => {
                //console.log("Credentials", credentials);

                document.getElementById("loader").style.display = "inline";

                config.uport_data = {name: credentials.name, email: credentials.email, phone: credentials.phone, country: credentials.country, avatar: credentials.avatar ? credentials.avatar.uri : null};

                if (config.auto_join_rooms && config.auto_join_rooms[0])
                {
                    config.auto_join_rooms[0] = {jid: config.auto_join_rooms[0], nick: credentials.name};
                }

                if (credentials.registration)
                {
                    //console.log("login existing user", credentials.registration);

                    config.authentication = "login";
                    config.jid = credentials.registration.xmpp;
                    config.password = credentials.registration.access;

                    document.getElementById("loader").style.display = "none";
                    converse.initialize(config);

                } else {

                    var url = "https://" + server + "/rest/api/restapi/v1/ask/uport/register";
                    var options = {method: "POST", headers: {"authorization": permission}, body: JSON.stringify({name: credentials.name, email: credentials.email, phone: credentials.phone, country: credentials.country, address: credentials.address, publicKey: credentials.publicKey, avatar: credentials.avatar, password: ""})};

                    //console.log("register new user", credentials);

                    fetch(url, options).then(function(response){ return response.text()}).then(function(userpass)
                    {
                        try {
                            userpass = JSON.parse(userpass);

                            //console.log('uport register ok', userpass);

                            window.uport.attestCredentials({
                                sub: credentials.address,
                                claim: {registration: {username: userpass.username, access: userpass.password, xmpp: userpass.username + "@" + config.locked_domain}},
                                exp: new Date().getTime() + 30 * 24 * 60 * 60 * 1000

                            }).then((result) => {
                                console.log('attestCredentials result', result);

                                config.authentication = "login";
                                config.jid = userpass.username + "@" + config.locked_domain;
                                config.password = userpass.password;

                                document.getElementById("loader").style.display = "none";
                                converse.initialize(config);

                            }).catch(function (err) {
                                console.error('attestCredentials error', err);
                                document.getElementById("loader").style.display = "none";
                                converse.initialize(config);
                            });

                        } catch (e) {
                            console.error('Credentials error', e);
                            document.getElementById("loader").style.display = "none";
                            converse.initialize(config);
                        }

                    }).catch(function (err) {
                        console.error('Credentials error', err);
                        document.getElementById("loader").style.display = "none";
                        converse.initialize(config);
                    });
                }

            }, function(err) {
                console.error("Credentials", err);
                document.getElementById("loader").style.display = "none";
                converse.initialize(config);
            });

        }).catch(function (err) {
            console.error('uPort permission error', err);
            document.getElementById("loader").style.display = "none";
            converse.initialize(config);
        });

    } else {
        document.getElementById("loader").style.display = "none";
        converse.initialize(config);
    }
});
