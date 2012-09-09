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
  return "utility: " + this.expected_utility.toFixed(2) + " seen: " + this.times_seen + "<br />"+ this.controller.get_past_attitude(this) + " (" + this.controller.get_future_attitude(this) + ")"
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
  if (emotion == null) { emotion = "none" }
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
  if (modelobject.expected_utility > 0.0) { return "like/love" }
  else if (modelobject.expected_utility < 0.0) { return "dislike/hate" }
  else { return "neutral" }
}

function get_future_attitude(modelobject) {
  if (modelobject.expected_utility > 0.0) { return "desire/hope" }
  else if (modelobject.expected_utility < 0.0) { return "disgust/fear" }
  else { return "neutral" }
}

function get_mood () {
  if (this.total_expected_utility() == null) { return "neutral" }
  if (this.total_expected_utility() > 0) { return "good" }
  else if (this.total_expected_utility() < 0) { return "bad" }
  return "neutral"
}

function print_controller () {
  var temp = "Expected rewards: " + this.total_expected_utility().toFixed(2) + "<br />Mood: " + this.get_mood() + "<br />Self: "
  for (var i = 0; i < this.known_objects.length; i++) {
    if (this.known_objects[i].realobject === this.body) { return temp + this.known_objects[i].toString() }
  }
  return temp + "value unknown"
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
   if (ev.utility > 0.0) { emotion = "delightment" }
   else if (ev.utility < 0.0) { emotion = "fright" }
   else { emotion = "surprise" }
  }
  else 
  {
    // expected events
    if (modelofcausing.expected_utility >= 0.0) 
    {
      if (ev.utility >= modelofcausing.expected_utility) { emotion = "satisfaction/joy" }
      else if (ev.utility < modelofcausing.expected_utility) { emotion = "disappointment" }
      else {  emotion = "neutral" }
    }
    else if (modelofcausing.expected_utility < 0.0) 
    {
      if (ev.utility > modelofcausing.expected_utility) { emotion = "relief" }
      else if (ev.utility <= modelofcausing.expected_utility) { emotion = "fears-confirmed/sadness" }
      else { emotion = "neutral" }
    }

    // emotion of target object towards causing object
    if (ev.utility > modelofcausing.expected_utility) 
    {
      if (this.body === ev.causing_object) { emotion += " and pride" }
      else { emotion += " and gratitude towards " + ev.causing_object.oid }
    }	
    else if (ev.utility < modelofcausing.expected_utility)
    {
      if (this.body === ev.causing_object) { emotion += " and remorse" }
      else { emotion += " and anger towards " + ev.causing_object.oid }
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
      emotion = "happy for " + ev.target_object.oid + " and pride"
    }
    else if (ev.utility < 0.0)
    {
      emotion = "pity/compassion towards " + ev.target_object.oid + ", remorse and anger towards self "
    }
    else { emotion = "neutral" }
  }
  else if (modeloftarget.expected_utility < 0.0)
  {
    if (ev.utility > 0.0)
    {
      emotion = " envy towards " + ev.target_object.oid + ", remorse and anger towards self"
    }
    else if (ev.utility < 0.0)
    {
      emotion = "gloating over/schadenfreude towards " + ev.target_object.oid + " and pride"
    }
    else { emotion = "neutral" }
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
      emotion = "happy for " + ev.target_object.oid
      if (ev.causing_object !== ev.target_object) { emotion += " and gratitude towards " + ev.causing_object.oid }
    }
    else if (ev.utility < 0.0)
    {
      emotion = "pity/compassion towards " + ev.target_object.oid
      if (ev.causing_object !== ev.target_object) { emotion += " and anger towards " + ev.causing_object.oid }
    }
    else
    {
      emotion = "neutral towards both"
    }
  }
  else if (modeloftarget.expected_utility < 0.0)
  {
    if (ev.utility > 0.0)
    {
      emotion = "envy towards " + ev.target_object.oid
      if (ev.causing_object !== ev.target_object) { emotion += " and anger towards " + ev.causing_object.oid }
    }
    else if (ev.utility < 0.0)
    {
      emotion = "gloating over/schadenfreude towards " + ev.target_object.oid
      if (ev.causing_object !== ev.target_object) { emotion += " and gratitude towards " + ev.causing_object.oid }
    }
    else
    {
      emotion = "neutral towards both"
    }
  }
  return emotion
}


