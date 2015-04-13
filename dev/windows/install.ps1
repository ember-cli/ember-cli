Set-ExecutionPolicy RemoteSigned -Scope Process -Force
iex ((new-object net.webclient).DownloadString('https://chocolatey.org/install.ps1'))

cinst nodejs.install -y
$ENV:PATH += ";C:\Program Files\nodejs"
npm i -g npm
del "C:\Program Files\nodejs\npm*"
rd "C:\Program Files\nodejs\node_modules" -recurse
$ENV:PATH += ";C:\Users\vagrant\AppData\Roaming\npm"

cinst git.install -y
$ENV:PATH += ";C:\Program Files (x86)\Git\cmd"

cinst phantomjs -y

cd C:\Users\vagrant
git clone https://github.com/ember-cli/ember-cli.git
cd ember-cli
npm i
