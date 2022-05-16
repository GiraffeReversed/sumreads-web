import os
import zipfile
from flask import Flask, send_from_directory, request, Response
from flask_talisman import Talisman
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__)
app.config["SUMMARIES_ZIP"] = "summaries.zip"
app.config["SPLIT"] = 10 ** 3
app.config["NOT_FOUND_IDS_FILE"] = "not_found_ids.txt"
app.secret_key = "super secret key"

Talisman(app, content_security_policy=None,
         strict_transport_security=False, force_https=False)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_host=1)


def get_summary_path(zip, book_id):
    hash_ = str(int(book_id) % app.config["SPLIT"])
    return zipfile.Path(zip).joinpath("summaries").joinpath(hash_).joinpath(book_id)


@app.route("/summaries/<string:book_id>", methods=["GET"])
def send_summarized(book_id: str):
    if not book_id.isdecimal():
        return {"message": "Don't even try"}, 400

    with zipfile.ZipFile(app.config["SUMMARIES_ZIP"], "r") as zip:
        path = get_summary_path(zip, book_id)
        if not path.exists():
            with open(app.config["NOT_FOUND_IDS_FILE"], "a") as f:
                f.write(f"{book_id}\n")
            return {"message" : "No such book summarized"}, 404

        contents = path.read_text()
        return Response(contents, mimetype="text/json")


# rightfully stolen from
# https://stackoverflow.com/a/14625619
@app.route('/robots.txt')
def static_from_root():
    return send_from_directory(app.static_folder, request.path[1:])


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")
