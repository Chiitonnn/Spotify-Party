# Spotify-Party

Installer flutter


    cd .\backend\

    python -m venv venv

    .\venv\Scripts\activate

    pip install -r requirements.txt

    cd ..

    cd .\mobile_app\

    flutter build web  

    cd ..

    cd .\backend\

    python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Pour tester le projet sur vos PC c'est : cd mobile_app
                                        >> flutter run -d chrome

et pour les push sur git et dcp sur render c'est : cd mobile_app
                                                    >> flutter build web --no-wasm-dry-run
                                                    >> cd ..
                                                    >> Copy-Item -Recurse -Force mobile_app\build\web\* frontend\
                                                    >> git add .
                                                    >> git commit -m "fix bouton"
                                                    >> git push