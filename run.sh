cd backend
nohup python server.py > ../server.log 2>&1 &
nohup ngrok http --domain=oop.ngrok.app 5000 > ../ngrok.log 2>&1 &
