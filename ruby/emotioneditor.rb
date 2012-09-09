#!/usr/bin/env ruby

# Emotion Editor
# Copyright Mika Turkia 2006
# 27-30.4.2006/25-31.7.2006

require_relative "controller"

$eventcounter = 0;
$next_oid = 0;

def next_oid
	$next_oid += 1;
	$next_oid
end

class RealObject

	attr_reader :oid

	def initialize
		@oid = next_oid
		@age = 0
		@lifetime = 0
		@alive = false
	end

	def increase_age
		@age += 1
		@alive = false if @age > @lifetime
	end

	def alive?
		@alive
	end

	def process_event(e)
	end

	def to_s
		" #{self.class} #{@oid} (age: #{@age}/#{@lifetime})"
	end
end


class Event

	attr_reader :time, :causing_object, :target_object, :utility

	def initialize(time, causing_object, target_object, utility)
		$eventcounter += 1
		@number = $eventcounter
		@time = time
		@causing_object = causing_object 
		@target_object = target_object 
		@utility = utility
	end

	def to_s
		"Event #{@number} (time #{@time}): #{causing_object.class} #{@causing_object.oid} " +
		"gives #{target_object.class} #{target_object.oid} an utility of #{@utility}." 
	end
end

class Action < Event
end


class Agent < RealObject

	def initialize(lifetime)
		super()
		@controller = Controller.new(self)
		@alive = true
		@lifetime = lifetime
	end

	def process_event(e)
		@controller.process_event(e)
	end

	def get_modelobject(realobject)
		@controller.get_modelobject(realobject)
	end

	def to_s
		super + @controller.to_s
	end
end


class Environment

	def initialize(realobjects)
		@realobjects = realobjects
		@time = 1
	end

	def get_realobject(oid)
		@realobjects.each do |o| return o if oid == o.oid end
		nil
	end

	def increase_time
		@time += 1
		@realobjects.each do |o| o.increase_age end
	end

	def start_life
		puts "\nLife starts with the following objects:"
		@realobjects.each do |a| puts a.to_s end
		puts

		begin
			print "Time #{@time}: Event (source,target,utility), time or stop (enter/t/s)? "
			command = gets.strip
			break if command == "s"
			if command == "t"
				increase_time
				next
			end

			causing_object, target_object, utility = command.split(",")
			next if not causing_object or not target_object or not utility
			next if not get_realobject(causing_object.to_i) or not get_realobject(target_object.to_i)
			e = Action.new(@time, get_realobject(causing_object.to_i), get_realobject(target_object.to_i), utility.to_i)
			puts e

			@realobjects.each do |o|
				#o.process_event(e)
				print " Emotion of #{o.class} #{o.oid} towards this event: #{o.process_event(e)}\n#{o}\n\n" if o.alive?
			end
		end while true
	end
end

e = Environment.new([Agent.new(5), Agent.new(5), Agent.new(3), RealObject.new()])
e.start_life


