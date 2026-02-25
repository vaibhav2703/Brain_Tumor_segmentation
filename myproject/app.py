from flask import Flask, render_template, request

app = Flask(_name_)

@app.route('/', methods=['GET'])
def hello_world():
    return render_template('home.component.html')

@app.route('/', methods=['POST'])
def predict():
    inputfiles=request.files['inputfiles']
    input_path = "./input/" + inputfiles.filename
    inputfiles.save(input_path)

    return render_template('home.compone    nt.html')

if _name_ == '_main_':
    app.run(host='0.0.0.0', port=8081, debug=True)