cd /var/www/game
echo "/* DEPLOY_CHECK_$(date +%s) */" >> app.js
tail -n 2 app.js
