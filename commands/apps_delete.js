'use strict'

const cli = require('heroku-cli-util');
const co = require('co');

function * app(context, heroku)  {

   let apps = [];
   if(context.flags.team) {
      apps = yield heroku.get('/teams/'+context.flags.team+'/apps').catch(err => cli.error(err));
   }  else {
      let allApps = yield heroku.get('/apps');
      // filter out to just apps that have no team
      for(let i in allApps) {
         if(!allApps[i].team) {
            apps.push(allApps[i]);
            cli.debug('adding '+allApps[i].name+' from team '+allApps[i].team);
         } else {
            cli.warn('ignoring app '+allApps[i].name+' from team '+allApps[i].team.name);
         }
      }
   }
   yield cli.confirmApp('delete', context.flags.confirm, 'This is a destructive action and will destroy '+apps.length+' apps');

   let deleteCalls = [];
   for(let i in apps) {
      let app = apps[i];
      let outcome = yield cli.action('Deleting app '+app.name, heroku.request({
            method: 'DELETE',
            path: '/apps/'+app.id,
         })).catch(err => cli.error(err));
   }   
}

module.exports = {
   topic: 'demokit',
   command: 'apps:delete',
   description: 'Will delete all apps in the given Team, if no team supplied, will delete Personal Apps',
   needsAuth: true,
   flags: [
      {name:'team', char:'t', description:'team to invite users to', hasValue:true, required:false},
      {name:'confirm', description:'confirm the destructive action of delete', hasValue:true}
   ],
   run: cli.command(co.wrap(app))
}