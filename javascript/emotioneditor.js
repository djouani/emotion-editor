// Emotion Editor
// Copyright Mika Turkia 2006-2007
// 27-30.4.2006/25-31.7.2006/24.1.2007

next_oid = 0

function get_next_oid () {
  next_oid += 1
  return next_oid
}

function event (time, causing_object, target_object, utility) {
  this.time = time
  this.causing_object = causing_object
  this.target_object = target_object
  this.utility = utility
  this.toString = print_event
}

function print_event () {
  return "Event " + this.time + ": Agent " + this.causing_object.oid + " gives agent " + 
         this.target_object.oid + " an utility of " + this.utility
}

function agent(lifetime) {
  this.oid = get_next_oid()
  this.controller = new controller(this)
  this.process_event = this.controller.process_event
  this.get_model = this.controller.get_model
  this.print_model2 = this.controller.print_model2
  this.toString = print_agent
}

function print_agent () {
  return this.controller.toString() + "<br />"
}

function environment (objects) {
  this.objects = objects
  this.time = 1
  this.start_life = start_life
  this.get_realobject = get_realobject
  this.process_user_event = process_user_event
}

function get_realobject(oid) {
  for (var i = 0; i < this.objects.length; i++) {
    if (this.objects[i].oid == oid) { return this.objects[i] }
  }
  return null
}

function start_life () {
  document.getElementById("results").innerHTML = "Life starts with "+this.objects.length+" agents."

  for (var i = 0; i < this.objects.length; i++) {
    document.getElementById("object" + (i+1) + "results").innerHTML = "Agent "+(i+1)+":<br /><br />" + this.objects[i].controller.toString() 
    for (var j = 0; j < this.objects.length; j++) {
      if (i != j) { 
        document.getElementById("result"+(i+1)+(j+1)).innerHTML = "unknown"
      }
    }
  }
  return 0;
}

function process_user_event (causing_object, target_object, utility) {
  ev = new event(this.time, this.get_realobject(causing_object), this.get_realobject(target_object), parseFloat(utility))

  document.getElementById("results").innerHTML = ev

  for (var i = 0; i < this.objects.length; i++) {
    document.getElementById("object" + (i+1) + "results").innerHTML = "Agent " + (i+1) + ":<br />" + this.objects[i].process_event(ev) + "<br />" + this.objects[i].controller.toString() 
 
    if (this.objects[i].controller.total_expected_utility() < 0.0) { document.getElementById("img"+(i+1)).src = "mood_bad.png" }
    else { document.getElementById("img"+(i+1)).src= "mood_good.png" }

    for (var j = 0; j < this.objects.length; j++) {
      if (i != j) { 
        document.getElementById("result"+(i+1)+(j+1)).innerHTML = this.objects[i].print_model2(this.objects[j]) 
      }
    }
  }

  this.time += 1
}


