'use strict'

const cli = require('heroku-cli-util');
const fs = require('fs');
const co = require('co');
const validator = require('validator');

function * app (context, heroku) {

   var allowedRoles = ["admin","member","owner"];
   // read the file and parse email, access tuples into an array
   var data = fs.readFileSync(context.flags.file).toString();
   var lines = data.split("\n");
   var users = [];
   for(var i in lines) {
      var user={};
      var parts = lines[i].split(",");
      // validate we have the expected number of parts in a row (i.e. 2)
      if(parts.length == 2) {
         user.email = parts[0].trim();
         user.role = parts[1].trim();
         // validate we have an email and an allowed role
         if(validator.isEmail(user.email) && allowedRoles.indexOf(user.role) > -1) {
            users.push(user);
         } else {
            // warn the user that row data is not being processed but don't stop
            cli.warn("Not processing this invalid file line:"+i+":"+lines[i]);
         }
      } else {
         // warn the user that row data is not being processed but don't stop
         cli.warn("Not processing this invalid file line:"+i+":"+lines[i]);
      }
   }
   cli.debug('Inviting users... ')
   let userOutput = yield users.map(inviteUser);
   cli.table(userOutput, {
      columns: [
         {key: 'user.email', label: 'User'},
         {key: 'role', label: 'Role'}
      ]
   });

   function inviteUser(user) {
      return heroku.request({
            method: 'PUT',
            path: '/teams/'+context.flags.team+'/invitations',
            body: {
               email: user.email,
               role: user.role
            }
         }
      )
   }
}


module.exports = {
   topic: 'demokit',
   command: 'users:invite',
   description: 'Read csv of user details and invite to the specified team.',
   needsAuth: true,
   flags: [
      {name:'team', char:'t', description:'[REQIURED] team to invite users to', hasValue:true, required:true},
      {name:'file', char:'f', description:'[REQIURED] path to csv file that has, per line, (email, [member|admin|viewer]) entries', hasValue:true, required:true}
   ],
   run: cli.command(co.wrap(app))
}
