import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import WordCloud from 'wordcloud';
// import { cloneDeep } from 'lodash';

// Load wink-nlp package  & helpers.
const winkNLP = require( 'wink-nlp' );
// Load english language model — light web version.
const model = require( 'wink-eng-lite-web-model' );
// Instantiate winkNLP.
const nlp = winkNLP( model, ["sentiment"] );
// const nlp = require( 'wink-nlp-utils' );
const its = nlp.its;
const as = nlp.as;

// rightfully stolen from
// https://stackoverflow.com/questions/1779013/check-if-string-contains-only-digits
function digitsOnly(str) {
  return /^\d*$/.test(str);
}

const VIEWS = ["characters", "aspects", "sentimental"];
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

class DescriptionsCard extends React.Component {
  render() {    
    return (
      <div className="col">
      <div className="card description-card">
        <div className="card-img-top"><canvas id={this.props.word + "Canvas"} /></div>
        <div className="card-body">
          <h5 className="card-title">{this.props.word}</h5>
          <h6 className="card-subtitle mb-2 text-muted small">{this.props.descs.length} descriptions</h6>
          <div>
            {this.props.descs.map((desc, i) => <p className="card-text" key={i}>{desc}</p>)}
          </div>
        </div>
      </div>
      </div>
    );
  }

  setupWordCloud() {
    let canvas = document.getElementById(this.props.word+"Canvas");
    let scale = 300;
    canvas.width = 2 * scale;
    canvas.height = 1 * scale;
    
    let doc = nlp.readDoc(this.props.descs.join(" "));
    let result = doc.tokens().filter(w => !w.out(its.stopWordFlag)).out( its.value, as.freqTable );

    let sum = result.reduce((partial, e) => partial + e[1], 0);
    let i = 0;
    while (result.length - i > 20 && result[i][1] / sum > 0.04) {
      sum -= result[i][1];
      i += 1;
    }
    
    result = result.slice(i, i + 200);
    
    let highest = Math.max(...result.map(entry => entry[1]));

    result.forEach(entry => {
      entry[1] = Math.floor(100 * entry[1] / highest);
    });
    
    // let rs = 0.5;
    // result.forEach((entry, i) => {
    //   entry[1] = Math.floor((rs * (entry[1] / (i > 0 ? result[i - 1][1] : 1)) + (1 - rs) * entry[1]));
    // })
    
    WordCloud(
      canvas,
      {
        list: result,
        fontFamily: "Courier New",
        minRotation: 0,
        maxRotation: 3.1415/2, // 90°
        rotationSteps: 2,
        shape:"square",
        color: function (word, weight) {
          function getColor(value){
            if (Math.abs(value) < 0.001)
              return "rgb(120, 120, 120)";
            value = (-value + 1) / 2;
            //value from 0 to 1
            var hue=((1-value)*120).toString(10);
            return ["hsl(",hue,",100%,30%)"].join("");
          }
          let doc = nlp.readDoc(word);
          let val = doc.sentences().itemAt(0).out(its.sentiment);
          return getColor(val);
        },
      }
    );
  }

  componentDidMount() {
    this.setupWordCloud();
  }

  componentDidUpdate() {
    this.setupWordCloud();
  }
}

class DescriptionsPanel extends React.Component {
  render() {
    return (
      <div className="row row-cols-1 row-cols-md-2 g-4">
        {this.props.descss.map((entry, i) => <DescriptionsCard key={i} word={entry[0]} descs={entry[1]} />)}
      </div>
    );
  }
}

class AllDescriptionsPanel extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentView: "characters",
    };
  }

  render() {
    let descriptions = this.props.descriptions;
    return (
    <div className="card">
      <div className="card-header pb-0 border-bottom-0">
      <ul className="nav nav-tabs" id="viewTabsNav" role="tablist">
          {VIEWS.map((view, i) =>
        <li className="nav-item" role="presentation" key={i}>
          <button
            className={"nav-link" + (i === 0 ? " active" : "")} id={view + "ViewTab"} data-bs-toggle="tab"
            data-bs-target={"#"+view+"ViewTabContent"} type="button" role="tab" aria-controls={view+"ViewTabContent"}
            aria-selected={i === 0 ? "true" : "false"}>
                {view}
              </button>
            </li>
          )}
        </ul>
      </div>
      <div className="tab-content" id="viewTabsContent">
        {VIEWS.map((view, i) => 
        <div className={"tab-pane m-3" + (i === 0 ? " show active" : "")} id={view+"ViewTabContent"} role="tabpanel" key={i}
          aria-labelledby={view + "ViewTab"}>
          <DescriptionsPanel descss={descriptions[view]} />
        </div>
        )}
      </div>
    </div>
    );
  }
}

class BookInfoPanel extends React.Component {
  render() {
    return (
      <div className="card my-3">
        <div className='card-body'>
          <span>{this.props.title}</span>{this.props.series ? <span className='text-muted'> ({this.props.series} series)</span> : ""}
        </div>
      </div>
    );
  }
}

class GetSummaryForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      bookId: ''
    };
  }

  updateBookId(e) {
    const newBookId = e.target.value;

    if (!digitsOnly(newBookId)) {
      alert("Input digits only.")
      return;
    }

    this.setState({
      bookId: newBookId
    });
  }

  requestBookSummary() {
    if (this.state.bookId.length === 0 || !digitsOnly(this.state.bookId)) {
      alert("Input digits only.");
      return;
    }

    this.props.requestBookSummary(this.state.bookId)
  }

  render() {
    return (
      <div className="input-group mt-3">
        <input
          type="number" className="form-control" placeholder="Input book id" aria-label="Book id" aria-describedby="getSummaryButton"
          value={this.state.bookId} onChange={e => this.updateBookId(e)}
        />
        <button
          className="btn btn-outline-secondary" type="button" id="getSummaryButton"
          onClick={() => this.requestBookSummary()}
        >
          <span className="spinner-border spinner-border-sm visually-hidden" role="status" aria-hidden="true"></span>
          <span> </span>Get summary
        </button>
      </div>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  prepareDescriptions(descriptions) {
    for (let view of VIEWS) {
      let entries = Object.entries(descriptions[view]);
      entries.forEach(entry => {
        entry[1].sort((a, b) => b.length - a.length);
      });

      entries.sort((ea, eb) => eb[1].length - ea[1].length);
      descriptions[view] = entries;

    }
    return descriptions;
  }

  requestBookSummary(bookId) {
    let button = document.getElementById("getSummaryButton");
    let spinner = button.getElementsByClassName("spinner-border")[0];

    button.disabled = true;
    spinner.classList.remove("visually-hidden");

    fetch(BACKEND_URL+"/summaries/"+bookId)
    .then(response => response.json())
    .then(descriptions => {
        button.disabled = false;
        spinner.classList.add("visually-hidden");
        this.setState({
          descriptions: this.prepareDescriptions(descriptions)
        });
      },
      error => {
        button.disabled = false;
        spinner.classList.add("visually-hidden");
        alert("No such book id summarized.")
      }
    );
  }

  render() {
    let descriptions = this.state.descriptions;
    return (
      <div>
        <GetSummaryForm requestBookSummary={book_id => this.requestBookSummary(book_id)}/>
        {descriptions && descriptions.title ? <BookInfoPanel title={descriptions["title"]} series={descriptions["series"]} /> : ""}
        {descriptions ? <AllDescriptionsPanel descriptions={descriptions}/> : ""}
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
