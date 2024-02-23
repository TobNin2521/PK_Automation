
function Get(url, cb) {
    fetch(url).then(res => res.json()).then((js) => {
        if(cb !== undefined && cb !== null) cb(js);
    }).catch((err) => console.log(err));
};

function Post(url, data, cb) {
    fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {"Content-Type": "application/json"}
    })
    .then(response => response.json())
    .then(data => cb(data)).catch((err) => console.log(err));
};

export {Get, Post};