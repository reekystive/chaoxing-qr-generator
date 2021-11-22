function init() {
    mdc.ripple.MDCRipple.attachTo(document.querySelector('.mdc-button'));
    mdc.topAppBar.MDCTopAppBar.attachTo(document.querySelector('.mdc-top-app-bar'));
    mdc.textField.MDCTextField.attachTo(document.querySelector('.mdc-text-field'));
    mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.mdc-snackbar'));

    let input = document.getElementById('my-input-1');
    input.addEventListener('keydown', (e) => {
        if (e.key == 'Enter') { generate(); }
    })
}

init();

const snackBar = mdc.snackbar.MDCSnackbar.attachTo(document.querySelector('.mdc-snackbar'));
const textField = mdc.textField.MDCTextField.attachTo(document.querySelector('.mdc-text-field'));
const qrCode = document.getElementById('my-qr-code');
let signCode = null;
let intervalId = null;

function openSnackBar(msg) {
    snackBar.close();
    snackBar.labelText = msg;
    snackBar.open();
}


function refreshCode(aid, enc) {
    let signCodeUrl = 'https://mobilelearn.chaoxing.com/newsign/signDetail?' +
        'activePrimaryId=' + aid + '&type=1';
    let httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', signCodeUrl, true);
    httpRequest.onreadystatechange = () => {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
            let obj = JSON.parse(httpRequest.responseText);
            let source = obj['source'];

            if (obj['signCode'] != signCode) {
                signCode = obj['signCode'];
                console.log('Refresh. Code: ' + signCode);
                openSnackBar('已刷新二维码');

                signString = 'url=SIGNIN%3A' +
                    'aid%3D' + aid + '%26' +
                    'source%3D' + source + '%26' +
                    'Code%3D' + signCode + '%26' +
                    'enc%3D' + enc;
                let qrCodeUrl = 'http://qcode.16q.cn/code.jspx?w=500&h=500&e=h&' + signString;
                qrCode.src = qrCodeUrl;
            }
        }
    }
    httpRequest.send();
}

function generate() {
    if (intervalId) {
        clearInterval(intervalId);
    }

    let text = textField.value.trim();
    if (text.length == 0) {
        openSnackBar('输入不能为空');
        return;
    }
    if (!text.startsWith('SIGNIN:')) {
        openSnackBar('输入格式有误');
        return;
    }

    text = text.slice(7);
    let argsStrings = text.split('&');
    let args = {};
    for (s of argsStrings) {
        let arg = s.split('=');
        args[arg[0]] = arg[1];
    }

    let aid = args['aid'];
    let enc = args['enc'];
    if (!(aid && enc)) {
        openSnackBar('无法从输入获取参数');
        return;
    }

    openSnackBar('已开始刷新');
    refreshCode(aid, enc);
    intervalId = setInterval(() => {
        refreshCode(aid, enc);
    }, 2000)
}