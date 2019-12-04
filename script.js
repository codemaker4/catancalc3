const DEFLINK = "https://codemaker4.github.io/catancalc3/index.html"
const NAMES = ["graan","hout","schaap","baksteen","ijzer","weiland","bos","boederij","baksteenfabriek","mijn"];
var OWNID = 0;
var nextTransID = 0;
var seenTransID = [];
var inventory = [0,0,0,0,0,0,0,0,0,0];
var shoppingCart = [0,0,0,0,0,0,0,0,0,0];

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function request() {
  // type="request";askID=<n>;cart=[<n>*10];conf=<n>
  var cartList = JSON.parse(getUrlVars()['cart']);
  var askID = parseInt(getUrlVars()['askID'])
  if (isNaN(askID)) {
    alert("Ongeldige ontvanger ID. Probeer opnieuw.");
    return
  }
  if (askID == OWNID) {
    alert("Twee de zelfde id's gevonden. Meld dit aan de spelleider.")
    return;
  }
  for (var i = 0; i < cartList.length; i++) {
    if (inventory[i] - cartList[i] < 0) {
      alert("Je hebt niet genoeg " + NAMES[i] + ".");
      return
    }
  }
  for (var i = 0; i < cartList.length; i++) {
    inventory[i] -= cartList[i];
  }

  // type="give";askID=<n>;giveID=<n>;transID=<n>;cart=[<n>*10];conf=<n>
  var link = DEFLINK + "?type=give&askID=" + askID.toString();
  link += "&giveID=" + OWNID.toString() + "&transID=" + nextTransID.toString();
  link += "&cart=[" + cartList.toString() + "]&conf=";
  var confNum = askID + OWNID + nextTransID
  confNum += cartList.reduce((a, b) => a + b, 0) // https://stackoverflow.com/questions/1230233/how-to-find-the-sum-of-an-array-of-numbers
  link += confNum.toString();

  console.log(link);
  new QRious({
      element: document.getElementById('qr'),
      value: link,
      size: document.innerWidth
  })
  alert("Ok. Nu moet de ontvanger de qr code scannen")

  nextTransID += 1;
}

function give() {
  // type="give";askID=<n>;giveID=<n>;transID=<n>;cart=[<n>*10];conf=<n>
  var askID = parseInt(getUrlVars()['askID'])
  if (askID !== OWNID) {
    alert('Deze QR code is niet voor jou.')
    return
  }
  var giveID = parseInt(getUrlVars()['giveID'])
  var transID = parseInt(getUrlVars()['transID'])
  if ((giveID.toString()+"."+transID.toString()) in seenTransID) {
    alert('Deze QR code is al gescand.')
    return
  }
  seenTransID += giveID.toString()+"."+transID.toString();
  localStorage.setItem('catc3_stransid',JSON.parse(seenTransID));
  var cartList = JSON.parse(getUrlVars()['cart']);
  var conf = askID + giveID + transID + cartList.reduce((a, b) => a + b, 0);
  if (conf.toString() !== getUrlVars()['conf']) {
    alert('Ongeldige code, probeer opnieuw.')
    return
  }
  for (var i = 0; i < cartList.length; i++) {
    inventory[i] += cartList[i];
  }
  alert('spul succesvol ontvangen')
}

if (getUrlVars()['type'] == 'reset') {
  OWNID = parseInt(getUrlVars()['id']);
  var defBuilding = OWNID%5
  var defInv = [0,0,0,0,0,0,0,0,0,0]
  defInv[defBuilding+5] = 1;
  defInv[defBuilding] = 2;
  localStorage.setItem('catc3_ownid', OWNID)
  localStorage.setItem('catc3_ntransid', 0);
  localStorage.setItem('catc3_invent', defInv);
  localStorage.setItem('catc3_stransid',"[]");

  setTimeout(function() {
    var link = DEFLINK + "?type=reset&id=" + (OWNID + 1).toString();
    console.log(link);
    new QRious({
        element: document.getElementById('qr'),
        value: link,
        size: document.body.offsetWidth
    })
  },0);

  alert("Ingesteld. Laat nu 1 persoon de onderstaande qr code scannen op de telefoon ook in te stellen. Alleen 1 persoon mag deze code scannen.");
}
OWNID = parseInt(localStorage.getItem('catc3_ownid'));
nextTransID = parseInt(localStorage.getItem('catc3_ntransid'));
inventory = JSON.parse("[" + localStorage.getItem('catc3_invent') + "]");
seenTransID = JSON.parse("[" + localStorage.getItem('catc3_stransid') + "]");

if (getUrlVars()['type'] == 'request') {
  request()
} else if (getUrlVars()['type'] == 'give') {
  give();
}

setTimeout(function () {
  for (var i = 0; i < 5; i++) {
    document.getElementById('rec_'+i.toString()+"_p").onclick = new Function("shkart("+i.toString()+",+1);");
    document.getElementById('rec_'+i.toString()+"_m").onclick = new Function("shkart("+i.toString()+",-1);");
    document.getElementById('bul_'+i.toString()+"_p").onclick = new Function("shkart("+(i+5).toString()+",+1);");
    document.getElementById('bul_'+i.toString()+"_m").onclick = new Function("shkart("+(i+5).toString()+",-1);");

    document.getElementById('rec_'+i.toString()).innerHTML = NAMES[i] + ": " + inventory[i].toString();
    document.getElementById('bul_'+i.toString()).innerHTML = NAMES[i+5] + ": " + inventory[i+5].toString();
  }
},0);

function shkart(type,amount) {
  if (shoppingCart[type] + amount < 0){
    // alert("je kan geen negatieve vraag hebben");
    return
  }
  shoppingCart[type] += amount;
  var id = "t_rec_";
  if (type>=5) {
    id = "t_bul_";
  }
  id += (type%5).toString();
  document.getElementById(id).innerHTML = NAMES[type] + ": "+ shoppingCart[type].toString();
  generateRequestQrCode();
}

function generateRequestQrCode() {
  var link = DEFLINK + "?type=request&askID=" + OWNID.toString() + "&cart=[";
  link += shoppingCart.toString();
  link += "]&conf=0";
  console.log(link);

  new QRious({
      element: document.getElementById('qr'),
      value: link,
      size: document.body.offsetWidth
  })
  // document.getElementById('qr').onclick = function() {open(link);};
}
