
# Catalyst

An Evolv **Env Integration** to support the renderRule framework. This framework makes 

## Goals
The goals for this framework are to provide the following:
1. Group all brittle site selectors in one place. This makes it easy to find the selectors that are based on customer's DOM that may be volatile. 
2. Handle idemponency.
3. Easly identify which parts of the page are experimented on. This could support tooling, support, and debugging.
4. Experiment specific setTimeout and setInterval calls. These are impacted by spa page navigation. Ideally these would be wrapped in APIs that handl navigation automatically. 
5. Simplify coding and support declaritive where possible.
6. Allow simple experiments to remain simple and support more complex tests (model view rendering)
7. Simplify things like Mutation Observer..

## Installation
Add the integration connector https://gist.github.com/rcowin/296f5ae45187ffdb74f47e8c4901189e.

### Setup
Add the following json config at environment level to enable the framework across a site
```
{
"pages": [
		"/"
]
}
```

## Usage
Once the integration is configured, you can setup some context js 

### Methods
The methods below are mostly analagous to their JavaScript or jQuery counterparts.

#### filter()
The `filter()` method creates a new array with all elements that pass the test implemented by the provided function.
```
var words = ['spray', 'limit', 'elite', 'exuberant', 'destruction', 'present'];
var result = $(words).filter((idx, word) => word.length > 6);
console.log(result);
// expected output: Array ["exuberant", "destruction", "present"]
```

#### find()
The `find()` method returns the all elements that match the specified child selector.
```
<ul id="sidebar">
<li>Lorum ipsum</li>
<li>Lorum ipsum</li>
<li>Lorum ipsum</li>
<li>Lorum ipsum</li>
<li>Lorum ipsum</li>
</ul>
$("#sidebar").find("li");
// expected output: array of 5 <li> elements.
```

#### closest()
The `closest()` method returns the parent element that matches the specified selector.
```
<ul id="sidebar">
<li>Lorum ipsum</li>
<li>Lorum ipsum</li>
<li>Lorum ipsum</li>
<li>Lorum ipsum</li>
<li>Lorum ipsum</li>
</ul>
$("li").closest("#sidebar");
// expected output: array with single <ul> element.
```

#### parent()
The `parent()` method returns the parent element of the specified selector.
```
<ul id="sidebar">
<li>Lorum ipsum</li>
<li>Lorum ipsum</li>
<li>Lorum ipsum</li>
<li>Lorum ipsum</li>
<li>Lorum ipsum</li>
</ul>
$("li").parent();
// expected output: array with single <ul> element.
```

#### children()
The `children()` method returns the child elements of the specified selector.
```
<ul id="sidebar">
<li>Lorum ipsum</li>
<li>Lorum ipsum</li>
<li>Lorum ipsum</li>
<li>Lorum ipsum</li>
<li>Lorum ipsum</li>
</ul>
$("ul").children();
// expected output: array with all <li> elements.
```

#### contains()
The `contains()` method returns a selector of the specified selector.
```
<ul id="sidebar">
<li>Lorum ipsum</li>
<li>Lorum ipsum</li>
<li>Lorum ipsum</li>
<li>Lorum ipsum</li>
<li>Lorum ipsum</li>
</ul>
$("ul").children();
// expected output: array with all <li> elements.
```


## Example

### Context level coding


```
// This is where you intialize the `rule` sandbox. Note the sandbox name appended at the end of the `renderRule`
var rule = window.evolv.renderRule.my_sandbox_1;
// Getting a reference to the store.  ToDo: describe the store
var store = rule.store;
// ToDo: perhaps rename so it doesn't collide or is confused with jQuery.
var $ = rule.$;

/*
instrumentDOM defines classes to keys. Those classes are then added to the one or more elements returned by the selectors. 
By default, instrumentDOM prefixes the classname with `evolv-` and uses the property name as the suffix to the class.
Each element is also tagged with a unique attribute to handle idenpotency (prevent an element from being manipulated more than once).
*/
store.instrumentDOM({
deviceTile:{
		get dom() {
				return $('.device-tile, .byod-device-tile');
		}
},
podParent:{
		get dom() {
				return $('.evolv-deviceTile [id*=mvo_ovr_devices]').first().parent();
		}
},
buttonParent:{
		get dom(){return $('button.addALine)').parent();},
		asClass: 'my-unique-button-class' // optional. 
}
});
```

Variant level coding

```
/**************
	Target Page (DOM)
***************/

<main>
	<form>
		<fieldset>
			<legend>User Info</legend>
			<ul>
				<li>
					<label for="firstName">First Name</label>
					<input type="text" id="firstName" name="firstName" />
				</li>
				<li>
					<label for="lastName">Last Name</label>
					<input type="text" id="lastName" name="lastName" />
				</li>
				<li>
					<label for="telNumber">Tel Number</label>
					<input type="tel" id="telNumber" name="telNumber" />
				</li>
			</ul>
			</fieldset>
	</form>
</main>

/**************
	Web Editor 
	Context JS Panel code:
***************/
var rule = window.evolv.renderRule.visble_homepage_1
var store = rule.store;
var $ = rule.$;
var $$ = rule.$$;

store.instrumentDOM({
	formInput: {
			get dom() {
					return $('form fieldset input');
			}
	},
	formLabel: {
			get dom() {
					return $('form fieldset label');
			}
	}
});

rule
		.whenDOM('.evolv-formInput')
		.then(el => {
			var inputEl = el.firstDom();
			var labelEl = inputEl.previousElementSibling;
			el.attr({"placeholder": labelEl.textContent});
		});

// Alternatively...

rule
	// use whenItem to reference the property name that was instrumented
		.whenItem('formInput')
		.then(el => {
			var inputEl = el.firstDom();
			var labelEl = inputEl.previousElementSibling;
			el.attr({"placeholder": labelEl.textContent});
		});

/**************
	Web Editor 
	Context SASS Panel code:
***************/
.evolv- {
	label {
		display: none
	}
}
```

whenItem('.evolv-buttonParent')
whenItem(store.buttonParent)

rule.subscribe(store.buttonParent)


Or to specific function that span variants

```
rule.app.createMainButton = function(){
rule
.whenDOM('.evolv-buttonParent')
.then(function(buttonParent){
	buttonParent.append(...)
};
```

## Modes


## rule object

### rule.store

#### store.instrumentDOM

```
store.instrumentDOM({
    deviceSection:{
        get dom(){ return $('#devicesSection')}
        // asClass is optional, the default class will match the key
        // asClass: 'devicesSection'
    },
    podParent:{
        get dom(){ return $('.evolv-devicesSection [id*=mvo_ovr_devices]').first().parent();}
        //following line is equivilant
        //get dom(){ return $$('devicesSection').find('[id*=mvo_ovr_devices]').first().parent();}
    },
});
```


### rule.whenDOM(<selector>)


### rule.whenItem(<instrumention key>)
    
    
rule.whenDom('.evolv-DeviceSection')




### rule.$


#### filter()

#### find()

#### closest()

#### parent()

#### children()

#### contains()

#### addClass()

#### removeClass()

#### append()
#### insertBefore()
#### on()
#### markOnce()
#### text()
#### attr()
#### closest()
#### each()
#### watch()
#### first()
#### last()
#### firstDom()
#### lastDom()

### rule.$$('<instrument key>')
The $$ function for rule allows 
    

## future

## Best Practices
This section provide a set of practices that improves the success of an Evolv experiment using this framework. Some of these practices are good things to follow regardless of which framework is being used.

### Include any part of the dom within the `instrumentDOM` section

### Use 'evolv-' prefixed selectors for all css


## API

