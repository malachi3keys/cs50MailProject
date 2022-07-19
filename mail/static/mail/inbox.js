// Use buttons to toggle between views
document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
document.querySelector('#compose').addEventListener('click', compose_email);

// By default, load the inbox
load_mailbox('inbox');

document.querySelector('form').addEventListener('submit', send_email);

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-email').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function reply_email(email) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-email').style.display = 'none';

  // Fill composition fields
  document.querySelector('#compose-recipients').value = `${email.sender}` /*person who sent email*/;
  document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp}, ${email.sender} wrote: \n${email.body}`;
  
  // Add "Re: " in front of current subject if not there
  subject = email.subject;
  if (subject.slice(0,3) == 'Re:')
  {
    document.querySelector('#compose-subject').value = `${email.subject}`;
  }else {
    document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
  }
}

function send_email(){
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
  });

  localStorage.clear();
  load_mailbox('sent');
  return false;
}

function archive_email(email){
  //change archive status of email
  archiveStatus = !email.archived;
  
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: archiveStatus
    })
  });
  
  localStorage.clear();
  load_mailbox('inbox');
  return false;
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  //Container for all emails
  const themails = document.createElement('div');
  themails.id = 'allemails';
  themails.classList.add('container');
  document.querySelector('#emails-view').append(themails);


  // Show emails for specific mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails)
    emails.forEach(element => emailspot(element, mailbox)); 
  });
}

function emailspot(email, mailbox) {
  // Make a div for each email
  const line = document.createElement('div');
  line.id = `emaildiv_${email.id}`;
  line.classList.add('row','lineprop');
  if (email.read && mailbox != 'sent'){
    line.classList.add('read');
  }
  document.querySelector('#allemails').append(line);

  // Sender or recipient 
  const tofrom = document.createElement('div');
  tofrom.setAttribute('id', `tofrom_${email.id}`);
  tofrom.classList.add('col-3', 'fw-bold', 'mx-2');
  if (mailbox == 'sent'){
    tofrom.innerHTML = `${email.recipients[0]}`;
  } else {
    tofrom.innerHTML = `${email.sender}`;
  }
  // Add an event listener to open email & show email is read
  tofrom.addEventListener('click', function() {
    mark_read(email);    
    single_email(email);
  });
  document.querySelector(`#emaildiv_${email.id}`).append(tofrom);

  // Email Subject
  const sub = document.createElement('div');
  sub.setAttribute('id', `emailsub_${email.id}`);
  sub.classList.add('col','mx-2');
  sub.innerHTML = `${email.subject}`;
  sub.addEventListener('click', function() {
      mark_read(email);    
      single_email(email);
  });
  document.querySelector(`#emaildiv_${email.id}`).append(sub);

  // Email timestamp
  const time = document.createElement('div');
  time.setAttribute('id', `timestamp_${email.id}`);
  time.classList.add('col-3', 'text-center');
  time.innerHTML = `${email.timestamp}`;
  document.querySelector(`#emaildiv_${email.id}`).append(time);

  //Add archive button for inbox and archive pages
  if (mailbox != 'sent'){
    const archdiv = document.createElement('div');
    archdiv.setAttribute('id', `arch-div_${email.id}`);
    archdiv.classList.add('col-2', 'px-2', 'text-center');
    document.querySelector(`#emaildiv_${email.id}`).append(archdiv);

    const archButton = document.createElement('button');
    archButton.setAttribute('id', `arch-button_${email.id}`);
    archButton.classList.add('btn', 'btn-sm', 'btn-dark');
    if (email.archived){
      archButton.innerHTML = '📁 Unarchive';
    }else {
      archButton.innerHTML = '📁 Archive';
    }
    archButton.addEventListener('click', () => archive_email(email));
    document.querySelector(`#arch-div_${email.id}`).append(archButton);  
  }
}

function mark_read(email){
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  });
}

function single_email(email){
  // Show the email and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email').style.display = 'block';
  
  //Clear contents from any previous open email
  document.querySelector('#single-body').innerHTML = '';
  document.querySelector('#title').innerHTML = `<h3>${email.subject}</h3>`;
  arch = document.querySelector('#single-archive');

  if (email.archived) {
    arch.innerHTML = '📁 Unarchive';  
  } else{
    arch.innerHTML = '📁 Archive';  
  }
  arch.addEventListener('click', () => archive_email(email));
  document.querySelector('#reply').addEventListener('click', () => reply_email(email));
  
  // Create new div with the email body in it
  const goodness = document.createElement('div');
  goodness.innerHTML = `${email.body}`;
  goodness.classList.add('mt-3', 'message')
  document.querySelector('#single-body').append(goodness);
}