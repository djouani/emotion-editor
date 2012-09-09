// Emotion Editor
// Copyright Mika Turkia 2006-2007
// 25-31.7.2006/24-25.1.2007/12.5.2007


function modelobject (controller, realobject, expected_utility) {
  this.controller = controller
  this.realobject = realobject
  this.expected_utility = expected_utility
  this.times_seen = 1
  this.update_utility = update_utility
  this.toString = print_modelobject
}

function update_utility(event) {
  this.times_seen += 1
  this.expected_utility = ((this.expected_utility * (this.times_seen - 1) + event.utility) / this.times_seen)
}

function print_model2 (realobject) {
  for (var i = 0; i < this.controller.known_objects.length; i++) {
    if (this.controller.known_objects[i].realobject === realobject) { return this.controller.known_objects[i].toString() }
  }
  return "unknown"
}

function print_modelobject () {
  return "hyöty: " + this.expected_utility.toFixed(2) + "<br />nähty: " + this.times_seen + " kertaa<br />"+ this.controller.get_past_attitude(this) + " (" + this.controller.get_future_attitude(this) + ")"
}

function controller (body) {
  this.known_objects = new Array()
  this.body = body
  this.process_event = c_process_event
  this.get_model = get_model
  this.print_model2 = print_model2
  this.update_modelobject = update_modelobject
  this.total_expected_utility = total_expected_utility
  this.avg_expected_utility = avg_expected_utility
  this.get_past_attitude = get_past_attitude
  this.get_future_attitude = get_future_attitude
  this.get_mood = get_mood
  this.toString = print_controller
  this.produce_affect = produce_affect
  this.produce_targets_affect = produce_targets_affect
  this.produce_causings_affect = produce_causings_affect
  this.produce_outsiders_affect = produce_outsiders_affect
}

function c_process_event(ev) {
  emotion = this.controller.produce_affect(ev)
  if (ev.target_object === this) { this.controller.update_modelobject(ev) }
  if (emotion == null) { emotion = "ei reaktiota" }
  return emotion
}

function get_model(realobject) {
  for (var i = 0; i < this.known_objects.length; i++) {
    if (this.known_objects[i].realobject === realobject) { return this.known_objects[i] }
  }
  return null
}

function update_modelobject(event) {
  for (var i = 0; i < this.known_objects.length; i++) {
    if (this.known_objects[i].realobject === event.causing_object) { 
      this.known_objects[i].update_utility(event)
      return null
    }
  }
  this.known_objects[this.known_objects.length] = new modelobject(this, event.causing_object, event.utility)
  this.known_objects.sort(sortModels)
  return null 
}

function sortModels(a, b) {
  return a.realobject.oid - b.realobject.oid
}

function total_expected_utility () {
  if (this.known_objects.length == 0) { return 0.0 }
  sum = 0.0
  for (var i = 0; i < this.known_objects.length; i++)
  {
    sum += this.known_objects[i].expected_utility
  }
  return sum
}

function avg_expected_utility () {
  return this.total_expected_utility() / this.known_objects.length
}

function get_past_attitude(modelobject) {
  if (modelobject.expected_utility > 0.0) { return "pitäminen/rakkaus" }
  else if (modelobject.expected_utility < 0.0) { return "ei-pitäminen/viha" }
  else { return "neutraali" }
}

function get_future_attitude(modelobject) {
  if (modelobject.expected_utility > 0.0) { return "halu/toivo" }
  else if (modelobject.expected_utility < 0.0) { return "inho/pelko" }
  else { return "neutraali" }
}

function get_mood () {
  if (this.total_expected_utility() == null) { return "neutraali" }
  if (this.total_expected_utility() > 0) { return "hyvä" }
  else if (this.total_expected_utility() < 0) { return "huono" }
  return "neutraali"
}

function print_controller () {
  var temp = "Odotettu kokonaishyöty: " + this.total_expected_utility().toFixed(2) + "<br />Mieliala: " + this.get_mood() + "<br />Itsearvostus: "
  for (var i = 0; i < this.known_objects.length; i++) {
    if (this.known_objects[i].realobject === this.body) { return temp + this.known_objects[i].toString() }
  }
  return temp + "tuntematon"
}

function produce_affect(ev) {
  // this = controller
  if (this.body === ev.target_object) { return this.produce_targets_affect(ev) }
  else if (this.body === ev.causing_object) { return this.produce_causings_affect(ev) }
  else { return this.produce_outsiders_affect(ev) }
  return null
}

function produce_targets_affect(e) {
  modelofcausing = ev.target_object.controller.get_model(ev.causing_object)
  var emotion = ""

  if (!modelofcausing)
  {
   // unexpected events
   if (ev.utility > 0.0) { emotion = "ilahtuminen" }
   else if (ev.utility < 0.0) { emotion = "pelästyminen" }
   else { emotion = "hämmästys" }
  }
  else 
  {
    // expected events
    if (modelofcausing.expected_utility >= 0.0) 
    {
      if (ev.utility >= modelofcausing.expected_utility) { emotion = "tyydytys/ilo" }
      else if (ev.utility < modelofcausing.expected_utility) { emotion = "pettymys" }
      else {  emotion = "neutraali" }
    }
    else if (modelofcausing.expected_utility < 0.0) 
    {
      if (ev.utility > modelofcausing.expected_utility) { emotion = "helpotus" }
      else if (ev.utility <= modelofcausing.expected_utility) { emotion = "pelkojen toteutuminen/suru" }
      else { emotion = "neutraali" }
    }

    // emotion of target object towards causing object
    if (ev.utility > modelofcausing.expected_utility) 
    {
      if (this.body === ev.causing_object) { emotion += " ja ylpeys" }
      else { emotion += " ja kiitollisuus " + ev.causing_object.oid + " kohtaan" }
    }	
    else if (ev.utility < modelofcausing.expected_utility)
    {
      if (this.body === ev.causing_object) { emotion += " ja katumus" }
      else { emotion += " ja ärtymys " + ev.causing_object.oid + " kohtaan" }
    }
  }
  return emotion
}

function produce_causings_affect(e) {

  modeloftarget = this.get_model(ev.target_object)

  if (!modeloftarget) { return null }

  var emotion = ""

  if (modeloftarget.expected_utility >= 0.0)
  {
    if (ev.utility > 0.0)
    {
      emotion = " iloinen " + ev.target_object.oid + " puolesta ja ylpeys"
    }
    else if (ev.utility < 0.0)
    {
      emotion = "sääli ja myötätunto " + ev.target_object.oid + " kohtaan, katumus ja ärtymys itseä kohtaan"
    }
    else { emotion = "neutraali" }
  }
  else if (modeloftarget.expected_utility < 0.0)
  {
    if (ev.utility > 0.0)
    {
      emotion = " kateus " + ev.target_object.oid + " kohtaan, katumus ja ärtymys itseä kohtaan"
    }
    else if (ev.utility < 0.0)
    {
      emotion = "vahingonilo " + ev.target_object.oid + " kohtaan ja ylpeys"
    }
    else { emotion = "neutraali" }
  }
  return emotion
}

function produce_outsiders_affect(e) {
  modelofcausing = this.get_model(ev.causing_object)
  modeloftarget = this.get_model(ev.target_object)
  if (!modeloftarget) { return null } 

  var emotion = ""

  if (modeloftarget.expected_utility >= 0.0)
  {
    if (ev.utility > 0.0)
    {
      emotion = "iloinen " + ev.target_object.oid + " puolesta" 
      if (ev.causing_object !== ev.target_object) { emotion += " ja kiitollisuus " + ev.causing_object.oid + " kohtaan" }
    }
    else if (ev.utility < 0.0)
    {
      emotion = " sääli/myötätunto " + ev.target_object.oid + " kohtaan"
      if (ev.causing_object !== ev.target_object) { emotion += " ja ärtymys " + ev.causing_object.oid + " kohtaan" }
    }
    else
    {
      emotion = "neutraali molempia kohtaan"
    }
  }
  else if (modeloftarget.expected_utility < 0.0)
  {
    if (ev.utility > 0.0)
    {
      emotion = "kateus " + ev.target_object.oid + " kohtaan"
      if (ev.causing_object !== ev.target_object) { emotion += " ja ärtymys " + ev.causing_object.oid + " kohtaan" }
    }
    else if (ev.utility < 0.0)
    {
      emotion = " vahingonilo " + ev.target_object.oid + " kohtaan"
      if (ev.causing_object !== ev.target_object) { emotion += " ja kiitollisuus " + ev.causing_object.oid + " kohtaan" }
    }
    else
    {
      emotion = "neutraali molempia kohtaan"
    }
  }
  return emotion
}


