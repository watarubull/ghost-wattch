//
let firebaseConfig = {

  authDomain: "chat-app-test-cfaf0.firebaseapp.com",
  projectId: "chat-app-test-cfaf0",
  storageBucket: "chat-app-test-cfaf0.appspot.com",
  messagingSenderId: "34374379606",
  appId: "1:34374379606:web:6ad0bfc9784fa911ab73f7"
}
firebase.initializeApp(firebaseConfig); 

//ログイン状態記録
let logStatus = 0;
let userIDkeep;

//データベース基本
const db = firebase.firestore();

// 日時をいい感じの形式にする関数
function convertFromFirestoreTimestampToDatetime(timestamp) {
  const _d = timestamp ? new Date(timestamp * 1000) : new Date();
  const Y = _d.getFullYear();
  const m = (_d.getMonth() + 1).toString().padStart(2, '0');
  const d = _d.getDate().toString().padStart(2, '0');
  const H = _d.getHours().toString().padStart(2, '0');
  const i = _d.getMinutes().toString().padStart(2, '0');
  const s = _d.getSeconds().toString().padStart(2, '0');
  return `${Y}/${m}/${d} ${H}:${i}:${s}`;
}

//メッセージ挿入用
const postComp = `
  <div class="message">
    <h3>投稿完了しました！</h3>
    <ul class="link-list flex tri">
      <li class="link-btn"><a href="./mylist.html">マイリストを見る</a></li>
      <li class="link-btn"><a href="./alllist.html">全体リストを見る</a></li>
      <li class="link-btn"><a href="./home.html">連続して投稿する</a></li>
    </ul>
  </div>
`;
const inputArea = `
<div class="input-area">
  <div class="box">
      <dl class="input-list">
          <dt>タイトル</dt>
          <dd><input type="text" id="ep-title"></dd>
          <dt>エピソード内容</dt>
          <dd><textarea name="episode" id="episode"></textarea></dd>
      </dl>
      <button id="post-btn" class="send-btn">投稿する</button>
  </div>
</div>
`;

//サインアップ処理
function signUp(email, password,name){
  firebase.auth().createUserWithEmailAndPassword(email, password)
  .then((userCredential) => {
    // Signed in
    logStatus = 1;
    const userID = userCredential.user.uid;
    const userData = {
      uid: userID,
      name: name,
      email: email,
      password: password
    }
    db.collection('users').doc(userID).set(userData)
    .then((doc) => {
      window.location.href = "./home.html";
    })
    .catch((error) => {
      console.log(`追加に失敗しました (${error})`);
    });
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log(errorMessage);
  });
}

//ログイン処理
function signIn(email, password){
  firebase.auth().signInWithEmailAndPassword(email, password)
  .then((userCredential) => {
    // Signed in
    logStatus = 1;
    window.location.href = "./home.html";
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log(errorMessage);
  });
}

//ログイン有無判定
function signInStatus(){
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      logStatus = 1;
      userIDkeep = user.uid;
      $("#login").html("logout");
      if(!$("#top").length){
        userInfoSet(userIDkeep)
      }
      //投稿一覧表示
      if($("#mylist").length){
        postListSet(1)
      }
      if($("#alllist").length){
        postListSet(0);
      }
    } else {
      // User is signed out
      // ...
      logStatus = 0;
      userIDkeep = "";
    }
  });
}

//ユーザー情報挿入
function userInfoSet(uid){
  const docRef = db.collection('users').doc(uid);
  docRef.get().then((doc) => {
    const userName = doc.data().name;
    const userMail = doc.data().email;
    $('#info .name span').html(userName);
    $('#info .email span').html(userMail);
  });
}

//ユーザーネーム取得
function userNameSet(uid){
  const docRef = db.collection('users').doc(uid);
  docRef.get().then((doc) => {
    postUserName = doc.data().name;
  });
}

//エピソード投稿
function postSet(data){
  db.collection('posts').add(data).then((doc)=>{
    $(".input-area").remove();
    $(".content").append(postComp);
  });
}

//自分の投稿取得
function postListSet(own){
  let dbPost;
  if(own == 1){
    dbPost = db.collection('posts').where('userID', '==', userIDkeep);
  }else{
    dbPost = db.collection('posts');
  }
  const myPostData = dbPost
  .orderBy('time', 'desc')
  .get().then((querySnapshot) => {
    const dataArray = [];
    querySnapshot.forEach((doc) => {
      const postData = {
        id: doc.id,
        data: doc.data(),
      };
      dataArray.push(postData);
    });
    dataArray.forEach(function(data) {
      console.log(data);
      let postUserName;
      const docRef = db.collection('users').doc(data.data.userID);
      docRef.get().then((doc) => {
        postUserName = doc.data().name;
        $('.epi-list').append(`
          <li id="${data.id}">
            <h3 class="title">${data.data.title}</h3>
            <div class="status">
                <p class="name">ユーザー：${postUserName}</p>
                <p class="date">${convertFromFirestoreTimestampToDatetime(data.data.time?.seconds)}</p>
            </div>
            <p class="episode">${data.data.episode}</p>
          </li>
        `);
      });
    }); 
  })
  .catch((error) => {
      console.log("Error getting documents: ", error);
  });
}

//イベントトリガー
$(function() {
  //サインアップイベント
  $("#signup-btn").on('click',function(){
    const userName = $('#name').val();
    const userMail = $('#email').val();
    const userPass = $('#pass').val();
    signUp(userMail,userPass,userName);
  });
  //ログインイベント
  $('#login-btn').on('click',function(){
    const userMail = $('#email').val();
    const userPass = $('#pass').val();
    signIn(userMail,userPass);
  });
  //ログアウトイベント
  $("#login").on('click',function(){
    if(logStatus == 0){
      window.location.href = "./login.html";
    }else{
      firebase.auth().signOut().then(() => {
        // Sign-out successful.
        logStatus = 0;
        window.location.href = "./index.html";
      }).catch((error) => {
        // An error happened.
      });
    }
  });
  //ログイン状態判定
  signInStatus();
  //投稿イベント
  $("#post-btn").on('click',function(){
    const postdata = {
      userID: userIDkeep,
      title: $('#ep-title').val(),
      episode: $('#episode').val(),
      time: firebase.firestore.FieldValue.serverTimestamp(),
    };
    postSet(postdata);
  });
  
});