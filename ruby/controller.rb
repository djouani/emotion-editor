#!/usr/bin/env ruby

# Emotion Editor
# Copyright Mika Turkia 2006
# 25-31.7.2006


class ModelObject

	attr_reader :realobject, :expected_utility, :times_seen

	def initialize(controller, realobject, expected_utility)
		@controller = controller
		@realobject = realobject
		@expected_utility = expected_utility
		@times_seen = 1
	end

	def update_utility(event)
		@times_seen += 1
		@expected_utility = ((@expected_utility.to_f * (@times_seen - 1) + event.utility) / @times_seen)
	end

	def to_s
		eutil = sprintf("%4.2f", @expected_utility)
		" ( #{@realobject.class} #{@realobject.oid} util=#{eutil} seen=#{times_seen.to_s} #{@controller.get_attitude(self)})"
	end
end


class Controller

	def initialize(body)
		@known_objects = []
		@event_history = []
		@body = body
	end

	def process_event(e)
		@event_history.push(e)
		emotion = produce_affect(e)
		update_modelobject(e)
		emotion
	end

	def get_modelobject(realobject)
		@known_objects.each do |o| return o if o.realobject === realobject end
		nil
	end

	def body
		@body 
	end

	def update_modelobject(event)
		return if not event.target_object === self.body
		@known_objects.each do |o|
			if o.realobject === event.causing_object 
				o.update_utility(event)
				return
			end
		end
		@known_objects.push(ModelObject.new(self, event.causing_object, event.utility))
	end

	def alive?
		@body.alive?
	end

	def total_expected_utility
		sum = 0.0
		@known_objects.each do |o| sum += o.expected_utility end
		sum
	end

	def avg_expected_utility
                return 0.0 if @known_objects.size == 0
		total_expected_utility/@known_objects.size
	end

	def get_attitude(modelobject)
		if modelobject.expected_utility > 0.0 then future_emotion = "desire/hope"; past_emotion = "like/love"
		elsif modelobject.expected_utility < 0.0 then future_emotion = "disgust/fear"; past_emotion = "dislike/hate"
		else future_emotion = "neutral"; past_emotion = "neutral" end
		"attitude: #{past_emotion}, future expectation: #{future_emotion})"
	end

	def get_mood
		return "neutral" if not avg_expected_utility 
		if total_expected_utility > 0
			"good"
		elsif total_expected_utility < 0
			"bad"
		else
			"neutral"
		end
	end

	def to_s
		eutil = sprintf("%4.2f", total_expected_utility) 
		" #{@body.class} #{@body.oid} expects an utility of #{eutil} (mood=#{get_mood})" +
		" and has seen #{@known_objects.size} objects:\n#{@known_objects.join("\n")}"
	end

	def produce_affect(e)

		return nil if not e.causing_object or not e.target_object or not self.alive?

		if self.body === e.target_object
			# must check also if self === e.causing_object
			produce_targets_affects(e)
		elsif self.body === e.causing_object
			produce_causings_affect(e)
		else
			produce_outsiders_affect(e)
		end
	end

	def produce_targets_affects(e)

		modelofcausing = e.target_object.get_modelobject(e.causing_object)

		if not modelofcausing 
			# unexpected events
			if e.utility > 0.0
				emotion = "delightment/ilahtuminen" 
			elsif e.utility < 0.0
				emotion = "fright/saikahdys"
			else
				emotion = "surprise"
			end
		else 
			# expected events
			if modelofcausing.expected_utility >= 0.0
				if e.utility > modelofcausing.expected_utility
					emotion = "joy/happiness (ilo/onni)"
				elsif e.utility < modelofcausing.expected_utility
					emotion = "disappointment/pettymys"
				else emotion = "neutral" end
			elsif modelofcausing.expected_utility < 0.0
				if e.utility > modelofcausing.expected_utility
					emotion = "relief (helpotus)"
				elsif e.utility < modelofcausing.expected_utility
					emotion = "sadness/distress (suru)"
				else emotion = "neutral" end
			end

			# emotion of target object towards causing object
			if e.utility >= modelofcausing.expected_utility
				if self.body === e.causing_object then 
					emotion += " and pride (ylpeys)"
				else
					emotion += " and gratitude/admiration (kiitollisuus/ihailu) towards #{e.causing_object.oid}"
				end	
			elsif e.utility < modelofcausing.expected_utility
				if self.body === e.causing_object then 
					emotion += " and remorse (katumus)"
				else
					emotion += " and anger/reproach (viha/inho) towards #{e.causing_object.oid}"
				end
			end
		end
	end

	def produce_causings_affect(e)

		modeloftarget = self.get_modelobject(e.target_object)
		return nil if modeloftarget == nil

		if modeloftarget.expected_utility >= 0.0
				if e.utility > 0.0
					emotion = "happy for (myotailo) towards #{e.target_object.oid} and pride"
				elsif e.utility < 0.0
					emotion = "pity/compassion towards #{e.target_object.oid} and remorse, shame and anger towards self "
				else emotion = "neutral" end
		elsif modeloftarget.expected_utility < 0.0
				if e.utility > 0.0
					emotion = " envy towards #{e.target_object.oid} and remorse, shame and anger towards self"
				elsif e.utility < 0.0
					emotion = "gloating over/schadenfreude (vahingonilo) towards #{e.target_object.oid} and pride"
				else emotion = "neutral" end
		end
		emotion
	end

	def produce_outsiders_affect(e)

		modelofcausing = self.get_modelobject(e.causing_object)
		modeloftarget = self.get_modelobject(e.target_object)
		return nil if not modeloftarget or not modelofcausing
		return nil if not modelofcausing.expected_utility

		if modeloftarget.expected_utility >= 0.0
				if e.utility > 0.0
					emotion = "happy for (myotailo) towards #{e.target_object.oid}"
					emotion += " and gratitude (kiitollisuus) towards #{e.causing_object.oid}" if not e.causing_object === e.target_object
				elsif e.utility < 0.0
					emotion = "pity/compassion (saali) towards #{e.target_object.oid}" 
					emotion += " and anger/reproach (viha/inho) towards #{e.causing_object.oid}" if not e.causing_object === e.target_object
				else
					emotion = "neutral (neutraali) towards both"
				end
		elsif modeloftarget.expected_utility < 0.0
				if e.utility > 0.0
					emotion = "envy (kateus) towards #{e.target_object.oid}"
					emotion += " and anger/reproach (viha/inho) towards #{e.causing_object.oid}" if not e.causing_object === e.target_object
				elsif e.utility < 0.0
					emotion = "gloating over/schadenfreude (vahingonilo) towards #{e.target_object.oid}"
					emotion += " and gratitude (kiitollisuus) towards #{e.causing_object.oid}" if not e.causing_object === e.target_object
				else
					emotion = "neutral (neutraali) towards both"
				end
		end
		emotion
	end
end


