termux-setup-storage
# Создаем папку проекта
mkdir -p ~/apple-app
cd ~/apple-app
# Копируем твои файлы из Documents в папку www
mkdir www
cp "/sdcard/Documents/Apple-Lester's/"* www/
npm init -y
npm i @capacitor/core @capacitor/android
npm i -D @capacitor/cli
# Инициализируем Capacitor
npx cap init "APPLE LESTER'S" com.apple.lester --web-dir www
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
yyy
y
pwnis
termux-setup-storage
pkg install nodejs git -y
mkdir -p ~/apple-app && cd ~/apple-app
mkdir www
cp "/sdcard/Documents/Apple-Lester's/"* www/
npm init -y
npm i @capacitor/core @capacitor/android
npm i -D @capacitor/cli
npx cap init "APPLE LESTER'S" com.apple.lester --web-dir www
npx cap add android
npx cap sync android
npx cap add android
npx cap sync android
